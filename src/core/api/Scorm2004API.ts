import { BaseScormAPI, ScormErrorCode } from "./ScormAPI"
import { DataModelValidator } from "../validators/DataModelValidator"
import type { Logger } from "../utils/Logger"

/**
 * Implementation of SCORM 2004 API
 */
export class Scorm2004API extends BaseScormAPI {
  private readonly API_NAME = "API_1484_11"
  private validator: DataModelValidator
  private logger: Logger

  constructor(logger: Logger) {
    super()
    this.logger = logger
    this.validator = new DataModelValidator("2004")
  }

  /**
   * Find the SCORM 2004 API in the parent windows
   */
  protected findLMS(): void {
    let win = window
    let findAttempts = 0
    const maxAttempts = 500

    while (win.parent != null && win.parent != win) {
      findAttempts++
      if (findAttempts > maxAttempts) {
        this.logger.error("Error finding API - exceeded maximum search attempts")
        break
      }

      if (win.API_1484_11 != null) {
        this.lmsConnection = win.API_1484_11
        this.logger.debug("Found SCORM 2004 API in parent window")
        return
      }

      win = win.parent
    }

    // Try to find the API in the opener window if it exists
    win = window.opener
    if (win) {
      findAttempts = 0
      while (win != null) {
        findAttempts++
        if (findAttempts > maxAttempts) {
          this.logger.error("Error finding API - exceeded maximum search attempts")
          break
        }

        if (win.API_1484_11 != null) {
          this.lmsConnection = win.API_1484_11
          this.logger.debug("Found SCORM 2004 API in opener window")
          return
        }

        if (win.parent == null || win.parent == win) {
          break
        }

        win = win.parent
      }
    }

    this.logger.error("Unable to find SCORM 2004 API")
  }

  /**
   * Get a value from the SCORM 2004 data model
   */
  getValue(element: string): string {
    if (!this.initialized) {
      this.setError(ScormErrorCode.NOT_INITIALIZED)
      return ""
    }

    if (!this.validator.isValidElement(element)) {
      this.setError(ScormErrorCode.INVALID_ARGUMENT)
      return ""
    }

    try {
      const value = this.lmsConnection.GetValue(element)
      const errorCode = Number.parseInt(this.lmsConnection.GetLastError(), 10)

      if (errorCode !== ScormErrorCode.NO_ERROR) {
        const errorString = this.lmsConnection.GetErrorString(errorCode)
        const diagnostic = this.lmsConnection.GetDiagnostic(errorCode)

        this.logger.warn(`Error getting value for ${element}: ${errorString} (${diagnostic})`)
        this.setError(errorCode)
        return ""
      }

      this.setError(ScormErrorCode.NO_ERROR)
      return value
    } catch (e) {
      this.logger.error(`Exception getting value for ${element}: ${e}`)
      this.setError(ScormErrorCode.GENERAL_EXCEPTION)
      return ""
    }
  }

  /**
   * Set a value in the SCORM 2004 data model
   */
  setValue(element: string, value: string): boolean {
    if (!this.initialized) {
      this.setError(ScormErrorCode.NOT_INITIALIZED)
      return false
    }

    if (!this.validator.isValidElement(element)) {
      this.setError(ScormErrorCode.INVALID_ARGUMENT)
      return false
    }

    if (!this.validator.validateValue(element, value)) {
      this.setError(ScormErrorCode.INVALID_SET_VALUE)
      return false
    }

    try {
      const result = this.lmsConnection.SetValue(element, value)
      const errorCode = Number.parseInt(this.lmsConnection.GetLastError(), 10)

      if (errorCode !== ScormErrorCode.NO_ERROR) {
        const errorString = this.lmsConnection.GetErrorString(errorCode)
        const diagnostic = this.lmsConnection.GetDiagnostic(errorCode)

        this.logger.warn(`Error setting value for ${element}: ${errorString} (${diagnostic})`)
        this.setError(errorCode)
        return false
      }

      this.setError(ScormErrorCode.NO_ERROR)
      return result
    } catch (e) {
      this.logger.error(`Exception setting value for ${element}: ${e}`)
      this.setError(ScormErrorCode.GENERAL_EXCEPTION)
      return false
    }
  }

  /**
   * Commit changes to the LMS
   */
  commit(parameter: string): boolean {
    if (!this.initialized) {
      this.setError(ScormErrorCode.NOT_INITIALIZED)
      return false
    }

    try {
      const result = this.lmsConnection.Commit(parameter)
      const errorCode = Number.parseInt(this.lmsConnection.GetLastError(), 10)

      if (errorCode !== ScormErrorCode.NO_ERROR) {
        const errorString = this.lmsConnection.GetErrorString(errorCode)
        const diagnostic = this.lmsConnection.GetDiagnostic(errorCode)

        this.logger.warn(`Error committing data: ${errorString} (${diagnostic})`)
        this.setError(errorCode)
        return false
      }

      this.setError(ScormErrorCode.NO_ERROR)
      return result
    } catch (e) {
      this.logger.error(`Exception committing data: ${e}`)
      this.setError(ScormErrorCode.GENERAL_EXCEPTION)
      return false
    }
  }

  /**
   * Initialize communication with the LMS
   */
  initialize(parameter: string): boolean {
    if (this.initialized) {
      this.setError(ScormErrorCode.GENERAL_EXCEPTION)
      return false
    }

    try {
      this.findLMS()
      if (!this.lmsConnection) {
        this.setError(ScormErrorCode.GENERAL_EXCEPTION)
        return false
      }

      const result = this.lmsConnection.Initialize(parameter)
      const errorCode = Number.parseInt(this.lmsConnection.GetLastError(), 10)

      if (errorCode !== ScormErrorCode.NO_ERROR) {
        const errorString = this.lmsConnection.GetErrorString(errorCode)
        const diagnostic = this.lmsConnection.GetDiagnostic(errorCode)

        this.logger.warn(`Error initializing API: ${errorString} (${diagnostic})`)
        this.setError(errorCode)
        return false
      }

      this.initialized = result
      this.setError(ScormErrorCode.NO_ERROR)
      return this.initialized
    } catch (e) {
      this.logger.error(`Exception initializing API: ${e}`)
      this.setError(ScormErrorCode.GENERAL_EXCEPTION)
      return false
    }
  }

  /**
   * Terminate communication with the LMS
   */
  terminate(parameter: string): boolean {
    if (!this.initialized) {
      this.setError(ScormErrorCode.NOT_INITIALIZED)
      return false
    }

    try {
      const result = this.lmsConnection.Terminate(parameter)
      const errorCode = Number.parseInt(this.lmsConnection.GetLastError(), 10)

      if (errorCode !== ScormErrorCode.NO_ERROR) {
        const errorString = this.lmsConnection.GetErrorString(errorCode)
        const diagnostic = this.lmsConnection.GetDiagnostic(errorCode)

        this.logger.warn(`Error terminating API: ${errorString} (${diagnostic})`)
        this.setError(errorCode)
        return false
      }

      this.initialized = false
      this.setError(ScormErrorCode.NO_ERROR)
      return result
    } catch (e) {
      this.logger.error(`Exception terminating API: ${e}`)
      this.setError(ScormErrorCode.GENERAL_EXCEPTION)
      return false
    }
  }
}
