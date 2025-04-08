import type { ScormAPI } from "./api/ScormAPI"
import { Scorm12API } from "./api/Scorm12API"
import { Scorm2004API } from "./api/Scorm2004API"
import { Logger, LogLevel } from "./utils/Logger"
import type { StorageAdapter } from "./storage/StorageAdapter"
import { LocalStorageAdapter } from "./storage/LocalStorageAdapter"

/**
 * Configuration options for the SCORM Engine
 */
export interface ScormEngineConfig {
  version?: "1.2" | "2004"
  debugMode?: boolean
  logLevel?: LogLevel
  autoCommitInterval?: number
  storageAdapter?: StorageAdapter
}

/**
 * Main SCORM Engine class
 */
export class ScormEngine {
  private api: ScormAPI | null = null
  private logger: Logger
  private config: ScormEngineConfig
  private storageAdapter: StorageAdapter
  private autoCommitTimer: number | null = null
  private initialized = false

  constructor(config: ScormEngineConfig = {}) {
    this.config = {
      version: "1.2",
      debugMode: false,
      logLevel: LogLevel.ERROR,
      autoCommitInterval: 60000, // 1 minute
      ...config,
    }

    this.logger = new Logger(this.config.logLevel, this.config.debugMode)
    this.storageAdapter = this.config.storageAdapter || new LocalStorageAdapter()
  }

  /**
   * Initialize the SCORM Engine
   */
  initialize(): boolean {
    if (this.initialized) {
      this.logger.warn("SCORM Engine already initialized")
      return true
    }

    this.logger.info(`Initializing SCORM Engine (version: ${this.config.version})`)

    // Create the appropriate API based on the SCORM version
    if (this.config.version === "1.2") {
      this.api = new Scorm12API(this.logger)
    } else {
      this.api = new Scorm2004API(this.logger)
    }

    // Initialize the API
    const result = this.api.initialize("")

    if (result) {
      this.initialized = true
      this.logger.info("SCORM Engine initialized successfully")

      // Start auto-commit timer if enabled
      if (this.config.autoCommitInterval && this.config.autoCommitInterval > 0) {
        this.startAutoCommit()
      }

      // Load cached data if available
      this.loadCachedData()
    } else {
      this.logger.error(`Failed to initialize SCORM Engine: ${this.api.getErrorString(this.api.getLastError())}`)

      // Fall back to local storage if LMS connection fails
      this.logger.info("Falling back to local storage mode")
      this.initialized = true
    }

    return this.initialized
  }

  /**
   * Terminate the SCORM Engine
   */
  terminate(): boolean {
    if (!this.initialized) {
      this.logger.warn("SCORM Engine not initialized")
      return false
    }

    this.logger.info("Terminating SCORM Engine")

    // Stop auto-commit timer
    this.stopAutoCommit()

    // Cache data before terminating
    this.cacheData()

    // Terminate the API
    let result = true
    if (this.api) {
      result = this.api.terminate("")
    }

    this.initialized = false
    this.logger.info("SCORM Engine terminated")

    return result
  }

  /**
   * Get a value from the SCORM data model
   */
  getValue(element: string): string {
    if (!this.initialized) {
      this.logger.warn("SCORM Engine not initialized")
      return ""
    }

    if (!this.api) {
      // Fall back to local storage
      return this.storageAdapter.getValue(element)
    }

    const value = this.api.getValue(element)
    this.logger.debug(`GetValue("${element}") = "${value}"`)

    return value
  }

  /**
   * Set a value in the SCORM data model
   */
  setValue(element: string, value: string): boolean {
    if (!this.initialized) {
      this.logger.warn("SCORM Engine not initialized")
      return false
    }

    this.logger.debug(`SetValue("${element}", "${value}")`)

    if (!this.api) {
      // Fall back to local storage
      return this.storageAdapter.setValue(element, value)
    }

    return this.api.setValue(element, value)
  }

  /**
   * Commit changes to the LMS
   */
  commit(): boolean {
    if (!this.initialized) {
      this.logger.warn("SCORM Engine not initialized")
      return false
    }

    this.logger.debug("Committing data to LMS")

    if (!this.api) {
      // Fall back to local storage
      return this.storageAdapter.commit()
    }

    return this.api.commit("")
  }

  /**
   * Get the last error code
   */
  getLastError(): number {
    if (!this.api) {
      return 0
    }

    return this.api.getLastError()
  }

  /**
   * Get the error string for a given error code
   */
  getErrorString(errorCode: number): string {
    if (!this.api) {
      return "No API available"
    }

    return this.api.getErrorString(errorCode)
  }

  /**
   * Get diagnostic information for a given error code
   */
  getDiagnostic(errorCode: number): string {
    if (!this.api) {
      return "No API available"
    }

    return this.api.getDiagnostic(errorCode)
  }

  /**
   * Start the auto-commit timer
   */
  private startAutoCommit(): void {
    if (this.autoCommitTimer) {
      this.stopAutoCommit()
    }

    this.logger.debug(`Starting auto-commit timer (interval: ${this.config.autoCommitInterval}ms)`)

    this.autoCommitTimer = window.setInterval(() => {
      this.logger.debug("Auto-committing data to LMS")
      this.commit()
    }, this.config.autoCommitInterval)
  }

  /**
   * Stop the auto-commit timer
   */
  private stopAutoCommit(): void {
    if (this.autoCommitTimer) {
      this.logger.debug("Stopping auto-commit timer")
      clearInterval(this.autoCommitTimer)
      this.autoCommitTimer = null
    }
  }

  /**
   * Cache data to local storage
   */
  private cacheData(): void {
    // Implement caching of important SCORM data to local storage
    // This allows for recovery if the session is interrupted
    this.logger.debug("Caching data to local storage")

    // Example: Cache lesson location and suspend data
    if (this.api) {
      const version = this.config.version

      if (version === "1.2") {
        const location = this.api.getValue("cmi.core.lesson_location")
        const suspendData = this.api.getValue("cmi.suspend_data")

        if (location) {
          this.storageAdapter.setValue("cmi.core.lesson_location", location)
        }

        if (suspendData) {
          this.storageAdapter.setValue("cmi.suspend_data", suspendData)
        }
      } else {
        const location = this.api.getValue("cmi.location")
        const suspendData = this.api.getValue("cmi.suspend_data")

        if (location) {
          this.storageAdapter.setValue("cmi.location", location)
        }

        if (suspendData) {
          this.storageAdapter.setValue("cmi.suspend_data", suspendData)
        }
      }

      this.storageAdapter.commit()
    }
  }

  /**
   * Load cached data from local storage
   */
  private loadCachedData(): void {
    // Load cached data from local storage if available
    this.logger.debug("Loading cached data from local storage")

    // Example: Load lesson location and suspend data
    const version = this.config.version

    if (version === "1.2") {
      const location = this.storageAdapter.getValue("cmi.core.lesson_location")
      const suspendData = this.storageAdapter.getValue("cmi.suspend_data")

      if (location && this.api) {
        this.api.setValue("cmi.core.lesson_location", location)
      }

      if (suspendData && this.api) {
        this.api.setValue("cmi.suspend_data", suspendData)
      }
    } else {
      const location = this.storageAdapter.getValue("cmi.location")
      const suspendData = this.storageAdapter.getValue("cmi.suspend_data")

      if (location && this.api) {
        this.api.setValue("cmi.location", location)
      }

      if (suspendData && this.api) {
        this.api.setValue("cmi.suspend_data", suspendData)
      }
    }
  }
}
