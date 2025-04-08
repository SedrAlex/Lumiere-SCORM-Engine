import type { Logger } from "../core/utils/Logger"
import { ManifestParser, type ScormManifest } from "./ManifestParser"
import JSZip from "jszip"
import type { ScormItem } from "./ManifestParser"

/**
 * Interface for SCORM package
 */
export interface ScormPackage {
  manifest: ScormManifest
  files: Map<string, Blob>
  baseUrl: string
}

/**
 * Loader for SCORM packages
 */
export class PackageLoader {
  private logger: Logger
  private manifestParser: ManifestParser

  constructor(logger: Logger) {
    this.logger = logger
    this.manifestParser = new ManifestParser(logger)
  }

  /**
   * Load a SCORM package from a URL
   */
  async loadFromUrl(url: string): Promise<ScormPackage | null> {
    try {
      this.logger.info(`Loading SCORM package from URL: ${url}`)

      const response = await fetch(url)
      if (!response.ok) {
        this.logger.error(`Failed to fetch package: ${response.statusText}`)
        return null
      }

      const packageBlob = await response.blob()
      return this.loadFromBlob(packageBlob)
    } catch (e) {
      this.logger.error(`Error loading package from URL: ${e}`)
      return null
    }
  }

  /**
   * Load a SCORM package from a File object
   */
  async loadFromFile(file: File): Promise<ScormPackage | null> {
    try {
      this.logger.info(`Loading SCORM package from file: ${file.name}`)
      return this.loadFromBlob(file)
    } catch (e) {
      this.logger.error(`Error loading package from file: ${e}`)
      return null
    }
  }

  /**
   * Load a SCORM package from a Blob
   */
  async loadFromBlob(blob: Blob): Promise<ScormPackage | null> {
    try {
      this.logger.info("Extracting SCORM package")

      // Load the zip file
      const zip = new JSZip()
      const zipContents = await zip.loadAsync(blob)

      // Find and parse the manifest
      const manifestFile = zipContents.file("imsmanifest.xml")
      if (!manifestFile) {
        this.logger.error("No imsmanifest.xml found in package")
        return null
      }

      const manifestXml = await manifestFile.async("string")
      const manifest = this.manifestParser.parseManifest(manifestXml)

      if (!manifest) {
        this.logger.error("Failed to parse manifest")
        return null
      }

      // Extract all files
      const files = new Map<string, Blob>()

      for (const filename in zipContents.files) {
        const file = zipContents.files[filename]

        if (!file.dir) {
          const content = await file.async("blob")
          files.set(filename, content)
        }
      }

      // Create a base URL for the package
      const baseUrl = URL.createObjectURL(blob) + "/"

      this.logger.info("SCORM package loaded successfully")

      return {
        manifest,
        files,
        baseUrl,
      }
    } catch (e) {
      this.logger.error(`Error extracting package: ${e}`)
      return null
    }
  }

  /**
   * Validate a SCORM package
   */
  validatePackage(pkg: ScormPackage): boolean {
    try {
      this.logger.info("Validating SCORM package")

      // Check if manifest has organizations
      if (pkg.manifest.organizations.length === 0) {
        this.logger.error("No organizations found in manifest")
        return false
      }

      // Check if manifest has resources
      if (Object.keys(pkg.manifest.resources).length === 0) {
        this.logger.error("No resources found in manifest")
        return false
      }

      // Check if all referenced resources exist
      for (const org of pkg.manifest.organizations) {
        for (const item of this.flattenItems(org.items)) {
          if (item.resourceIdentifier && !pkg.manifest.resources[item.resourceIdentifier]) {
            this.logger.error(`Resource not found: ${item.resourceIdentifier}`)
            return false
          }
        }
      }

      // Check if all resource files exist in the package
      for (const resourceId in pkg.manifest.resources) {
        const resource = pkg.manifest.resources[resourceId]

        for (const file of resource.files) {
          if (!pkg.files.has(file)) {
            this.logger.warn(`File not found in package: ${file}`)
            // Don't fail validation for missing files, just warn
          }
        }
      }

      this.logger.info("SCORM package validation successful")
      return true
    } catch (e) {
      this.logger.error(`Error validating package: ${e}`)
      return false
    }
  }

  /**  {
      this.logger.error(`Error validating package: ${e}`);
      return false;
    }
  }
  
  /**
   * Flatten a nested array of items into a single array
   */
  private flattenItems(items: ScormItem[]): ScormItem[] {
    let result: ScormItem[] = []

    for (const item of items) {
      result.push(item)
      if (item.children.length > 0) {
        result = result.concat(this.flattenItems(item.children))
      }
    }

    return result
  }
}
