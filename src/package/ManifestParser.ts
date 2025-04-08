import type { Logger } from "../core/utils/Logger"

/**
 * Interface for SCORM manifest metadata
 */
export interface ScormManifestMetadata {
  schema: string
  schemaVersion: string
  title: string
  description: string
  keywords: string[]
  duration: string
}

/**
 * Interface for SCORM resource
 */
export interface ScormResource {
  identifier: string
  type: string
  href: string
  dependencies: string[]
  files: string[]
}

/**
 * Interface for SCORM organization item
 */
export interface ScormItem {
  identifier: string
  title: string
  resourceIdentifier: string
  children: ScormItem[]
  prerequisites?: string
  maxtimeallowed?: string
  timelimitaction?: string
  datafromlms?: string
  masteryscore?: string
}

/**
 * Interface for SCORM organization
 */
export interface ScormOrganization {
  identifier: string
  title: string
  items: ScormItem[]
}

/**
 * Interface for SCORM manifest
 */
export interface ScormManifest {
  identifier: string
  version: string
  metadata: ScormManifestMetadata
  organizations: ScormOrganization[]
  defaultOrganization: string
  resources: Record<string, ScormResource>
}

/**
 * Parser for SCORM manifest files (imsmanifest.xml)
 */
export class ManifestParser {
  private logger: Logger

  constructor(logger: Logger) {
    this.logger = logger
  }

  /**
   * Parse a SCORM manifest XML string
   */
  parseManifest(xmlString: string): ScormManifest | null {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, "text/xml")

      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror")
      if (parserError) {
        this.logger.error(`XML parsing error: ${parserError.textContent}`)
        return null
      }

      // Parse manifest
      const manifestElement = xmlDoc.querySelector("manifest")
      if (!manifestElement) {
        this.logger.error("No manifest element found in XML")
        return null
      }

      const identifier = manifestElement.getAttribute("identifier") || ""
      const version = manifestElement.getAttribute("version") || ""

      // Parse metadata
      const metadata = this.parseMetadata(manifestElement)

      // Parse organizations
      const organizationsElement = manifestElement.querySelector("organizations")
      const defaultOrganization = organizationsElement?.getAttribute("default") || ""
      const organizations = this.parseOrganizations(organizationsElement)

      // Parse resources
      const resources = this.parseResources(manifestElement.querySelector("resources"))

      return {
        identifier,
        version,
        metadata,
        organizations,
        defaultOrganization,
        resources,
      }
    } catch (e) {
      this.logger.error(`Error parsing manifest: ${e}`)
      return null
    }
  }

  /**
   * Parse metadata from manifest
   */
  private parseMetadata(manifestElement: Element): ScormManifestMetadata {
    const metadataElement = manifestElement.querySelector("metadata")

    const schema = metadataElement?.querySelector("schema")?.textContent || ""
    const schemaVersion = metadataElement?.querySelector("schemaversion")?.textContent || ""

    // Parse LOM metadata if available
    const lomElement = metadataElement?.querySelector("lom")

    const title =
      lomElement?.querySelector("general > title > string")?.textContent ||
      metadataElement?.querySelector("title")?.textContent ||
      ""

    const description =
      lomElement?.querySelector("general > description > string")?.textContent ||
      metadataElement?.querySelector("description")?.textContent ||
      ""

    // Parse keywords
    const keywords: string[] = []
    lomElement?.querySelectorAll("general > keyword > string").forEach((keyword) => {
      if (keyword.textContent) {
        keywords.push(keyword.textContent)
      }
    })

    // Parse duration
    const duration = lomElement?.querySelector("technical > duration > datetime")?.textContent || ""

    return {
      schema,
      schemaVersion,
      title,
      description,
      keywords,
      duration,
    }
  }

  /**
   * Parse organizations from manifest
   */
  private parseOrganizations(organizationsElement: Element | null): ScormOrganization[] {
    if (!organizationsElement) {
      return []
    }

    const organizations: ScormOrganization[] = []

    organizationsElement.querySelectorAll("organization").forEach((orgElement) => {
      const identifier = orgElement.getAttribute("identifier") || ""
      const title = orgElement.querySelector("title")?.textContent || ""

      // Parse items recursively
      const items = this.parseItems(orgElement)

      organizations.push({
        identifier,
        title,
        items,
      })
    })

    return organizations
  }

  /**
   * Parse items from organization recursively
   */
  private parseItems(parentElement: Element): ScormItem[] {
    const items: ScormItem[] = []

    parentElement.querySelectorAll(":scope > item").forEach((itemElement) => {
      const identifier = itemElement.getAttribute("identifier") || ""
      const title = itemElement.querySelector("title")?.textContent || ""
      const resourceIdentifier = itemElement.getAttribute("identifierref") || ""

      // Parse additional SCORM attributes
      const prerequisites = itemElement.querySelector("adlcp:prerequisites")?.textContent
      const maxtimeallowed = itemElement.querySelector("adlcp:maxtimeallowed")?.textContent
      const timelimitaction = itemElement.querySelector("adlcp:timelimitaction")?.textContent
      const datafromlms = itemElement.querySelector("adlcp:datafromlms")?.textContent
      const masteryscore = itemElement.querySelector("adlcp:masteryscore")?.textContent

      // Parse child items recursively
      const children = this.parseItems(itemElement)

      items.push({
        identifier,
        title,
        resourceIdentifier,
        children,
        prerequisites,
        maxtimeallowed,
        timelimitaction,
        datafromlms,
        masteryscore,
      })
    })

    return items
  }

  /**
   * Parse resources from manifest
   */
  private parseResources(resourcesElement: Element | null): Record<string, ScormResource> {
    if (!resourcesElement) {
      return {}
    }

    const resources: Record<string, ScormResource> = {}

    resourcesElement.querySelectorAll("resource").forEach((resourceElement) => {
      const identifier = resourceElement.getAttribute("identifier") || ""
      const type = resourceElement.getAttribute("type") || ""
      const href = resourceElement.getAttribute("href") || ""

      // Parse dependencies
      const dependencies: string[] = []
      resourceElement.querySelectorAll("dependency").forEach((depElement) => {
        const identifierref = depElement.getAttribute("identifierref")
        if (identifierref) {
          dependencies.push(identifierref)
        }
      })

      // Parse files
      const files: string[] = []
      resourceElement.querySelectorAll("file").forEach((fileElement) => {
        const href = fileElement.getAttribute("href")
        if (href) {
          files.push(href)
        }
      })

      resources[identifier] = {
        identifier,
        type,
        href,
        dependencies,
        files,
      }
    })

    return resources
  }
}
