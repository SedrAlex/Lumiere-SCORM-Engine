/**
 * Log levels for the SCORM API
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

/**
 * Logger for SCORM API
 */
export class Logger {
  private level: LogLevel
  private debugMode: boolean

  constructor(level: LogLevel = LogLevel.ERROR, debugMode = false) {
    this.level = level
    this.debugMode = debugMode
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[SCORM ERROR] ${message}`)
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[SCORM WARNING] ${message}`)
    }
  }

  /**
   * Log an info message
   */
  info(message: string): void {
    if (this.level >= LogLevel.INFO) {
      console.info(`[SCORM INFO] ${message}`)
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[SCORM DEBUG] ${message}`)
    }
  }

  /**
   * Log a message to the console if debug mode is enabled
   */
  logDebug(message: string, data?: any): void {
    if (this.debugMode) {
      if (data) {
        console.log(`[SCORM] ${message}`, data)
      } else {
        console.log(`[SCORM] ${message}`)
      }
    }
  }
}
