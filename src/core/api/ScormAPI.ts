/**
 * Core SCORM API interface that defines methods required by both SCORM 1.2 and 2004
 */
export interface ScormAPI {
  initialize(parameter: string): boolean
  terminate(parameter: string): boolean
  getValue(element: string): string
  setValue(element: string, value: string): boolean
  commit(parameter: string): boolean
  getLastError(): number
  getErrorString(errorCode: number): string
  getDiagnostic(errorCode: number): string
}

/**
 * Error codes for SCORM API
 */
export enum ScormErrorCode {
  NO_ERROR = 0,
  GENERAL_EXCEPTION = 101,
  INVALID_ARGUMENT = 201,
  ELEMENT_CANNOT_HAVE_CHILDREN = 202,
  ELEMENT_NOT_AN_ARRAY = 203,
  NOT_INITIALIZED = 301,
  NOT_IMPLEMENTED = 401,
  INVALID_SET_VALUE = 402,
  ELEMENT_IS_READ_ONLY = 403,
  ELEMENT_IS_WRITE_ONLY = 404,
  INCORRECT_DATA_TYPE = 405,
}

/**
 * Base class for SCORM API implementations
 */
export abstract class BaseScormAPI implements ScormAPI {
  protected initialized = false
  protected lastError: ScormErrorCode = ScormErrorCode.NO_ERROR
  protected lmsConnection: any = null

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

      this.initialized = true
      this.setError(ScormErrorCode.NO_ERROR)
      return true
    } catch (e) {
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
      this.initialized = false
      this.setError(ScormErrorCode.NO_ERROR)
      return true
    } catch (e) {
      this.setError(ScormErrorCode.GENERAL_EXCEPTION)
      return false
    }
  }

  /**
   * Get a value from the SCORM data model
   */
  abstract getValue(element: string): string

  /**
   * Set a value in the SCORM data model
   */
  abstract setValue(element: string, value: string): boolean

  /**
   * Commit changes to the LMS
   */
  commit(parameter: string): boolean {
    if (!this.initialized) {
      this.setError(ScormErrorCode.NOT_INITIALIZED)
      return false
    }

    try {
      this.setError(ScormErrorCode.NO_ERROR)
      return true
    } catch (e) {
      this.setError(ScormErrorCode.GENERAL_EXCEPTION)
      return false
    }
  }

  /**
   * Get the last error code
   */
  getLastError(): number {
    return this.lastError
  }

  /**
   * Get the error string for a given error code
   */
  getErrorString(errorCode: number): string {
    switch (errorCode) {
      case ScormErrorCode.NO_ERROR:
        return "No error"
      case ScormErrorCode.GENERAL_EXCEPTION:
        return "General exception"
      case ScormErrorCode.INVALID_ARGUMENT:
        return "Invalid argument"
      case ScormErrorCode.ELEMENT_CANNOT_HAVE_CHILDREN:
        return "Element cannot have children"
      case ScormErrorCode.ELEMENT_NOT_AN_ARRAY:
        return "Element is not an array"
      case ScormErrorCode.NOT_INITIALIZED:
        return "Not initialized"
      case ScormErrorCode.NOT_IMPLEMENTED:
        return "Not implemented"
      case ScormErrorCode.INVALID_SET_VALUE:
        return "Invalid set value"
      case ScormErrorCode.ELEMENT_IS_READ_ONLY:
        return "Element is read only"
      case ScormErrorCode.ELEMENT_IS_WRITE_ONLY:
        return "Element is write only"
      case ScormErrorCode.INCORRECT_DATA_TYPE:
        return "Incorrect data type"
      default:
        return "Unknown error"
    }
  }

  /**
   * Get diagnostic information for a given error code
   */
  getDiagnostic(errorCode: number): string {
    return this.getErrorString(errorCode)
  }

  /**
   * Set the current error code
   */
  protected setError(errorCode: ScormErrorCode): void {
    this.lastError = errorCode
  }

  /**
   * Find the LMS API adapter
   */
  protected abstract findLMS(): void
}
