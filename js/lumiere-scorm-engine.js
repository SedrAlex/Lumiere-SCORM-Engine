// Mock implementation of the Lumiére SCORM Engine for testing
;((global) => {
  // Define LogLevel enum
  const LogLevel = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
  }

  // Logger class
  class Logger {
    constructor(level = LogLevel.ERROR, debugMode = false) {
      this.level = level
      this.debugMode = debugMode
    }

    error(message) {
      if (this.level >= LogLevel.ERROR) {
        console.error(`[SCORM ERROR] ${message}`)
      }
    }

    warn(message) {
      if (this.level >= LogLevel.WARN) {
        console.warn(`[SCORM WARNING] ${message}`)
      }
    }

    info(message) {
      if (this.level >= LogLevel.INFO) {
        console.info(`[SCORM INFO] ${message}`)
      }
    }

    debug(message) {
      if (this.level >= LogLevel.DEBUG) {
        console.debug(`[SCORM DEBUG] ${message}`)
      }
    }
  }

  // Mock SCORM API
  class ScormEngine {
    constructor(config = {}) {
      this.config = {
        version: "1.2",
        debugMode: false,
        logLevel: LogLevel.ERROR,
        autoCommitInterval: 60000,
        ...config,
      }

      this.logger = new Logger(this.config.logLevel, this.config.debugMode)
      this.initialized = false
      this.data = {
        // SCORM 1.2 data model
        "cmi.core.student_id": "12345",
        "cmi.core.student_name": "Test Student",
        "cmi.core.lesson_location": "",
        "cmi.core.lesson_status": "not attempted",
        "cmi.core.score.raw": "0",
        "cmi.core.score.min": "0",
        "cmi.core.score.max": "100",
        "cmi.suspend_data": "",

        // SCORM 2004 data model
        "cmi.learner_id": "12345",
        "cmi.learner_name": "Test Student",
        "cmi.location": "",
        "cmi.completion_status": "not attempted",
        "cmi.success_status": "unknown",
        "cmi.score.raw": "0",
        "cmi.score.min": "0",
        "cmi.score.max": "100",
        "cmi.score.scaled": "0",
        "cmi.progress_measure": "0",
        "cmi.suspend_data": "",
      }

      this.autoCommitTimer = null
    }

    initialize() {
      if (this.initialized) {
        this.logger.warn("Already initialized")
        return true
      }

      this.logger.info("Initializing SCORM Engine")
      this.initialized = true

      // Start auto-commit timer
      if (this.config.autoCommitInterval > 0) {
        this.autoCommitTimer = setInterval(() => {
          this.commit()
        }, this.config.autoCommitInterval)
      }

      return true
    }

    terminate() {
      if (!this.initialized) {
        this.logger.warn("Not initialized")
        return false
      }

      this.logger.info("Terminating SCORM Engine")

      // Stop auto-commit timer
      if (this.autoCommitTimer) {
        clearInterval(this.autoCommitTimer)
        this.autoCommitTimer = null
      }

      this.initialized = false
      return true
    }

    getValue(element) {
      if (!this.initialized) {
        this.logger.warn("Not initialized")
        return ""
      }

      this.logger.debug(`GetValue: ${element}`)
      return this.data[element] || ""
    }

    setValue(element, value) {
      if (!this.initialized) {
        this.logger.warn("Not initialized")
        return false
      }

      this.logger.debug(`SetValue: ${element} = ${value}`)
      this.data[element] = value
      return true
    }

    commit() {
      if (!this.initialized) {
        this.logger.warn("Not initialized")
        return false
      }

      this.logger.debug("Commit")
      return true
    }
  }

  // Course tracker
  class CourseTracker {
    constructor(scorm, logger) {
      this.scorm = scorm
      this.logger = logger
      this.version = scorm.config.version
      this.startTime = Date.now()
    }

    getTrackingData() {
      if (this.version === "1.2") {
        return {
          location: this.scorm.getValue("cmi.core.lesson_location"),
          progress: 0,
          score: Number.parseFloat(this.scorm.getValue("cmi.core.score.raw") || "0"),
          maxScore: Number.parseFloat(this.scorm.getValue("cmi.core.score.max") || "100"),
          minScore: Number.parseFloat(this.scorm.getValue("cmi.core.score.min") || "0"),
          status: this.scorm.getValue("cmi.core.lesson_status"),
          suspendData: this.scorm.getValue("cmi.suspend_data"),
          sessionTime: "00:00:00",
          totalTime: "00:00:00",
        }
      } else {
        return {
          location: this.scorm.getValue("cmi.location"),
          progress: Number.parseFloat(this.scorm.getValue("cmi.progress_measure") || "0"),
          score: Number.parseFloat(this.scorm.getValue("cmi.score.raw") || "0"),
          maxScore: Number.parseFloat(this.scorm.getValue("cmi.score.max") || "100"),
          minScore: Number.parseFloat(this.scorm.getValue("cmi.score.min") || "0"),
          status: this.scorm.getValue("cmi.completion_status"),
          suspendData: this.scorm.getValue("cmi.suspend_data"),
          sessionTime: "PT0H0M0S",
          totalTime: "PT0H0M0S",
        }
      }
    }

    setLocation(location) {
      this.logger.debug(`Setting location: ${location}`)

      if (this.version === "1.2") {
        return this.scorm.setValue("cmi.core.lesson_location", location)
      } else {
        return this.scorm.setValue("cmi.location", location)
      }
    }

    setProgress(progress) {
      if (this.version !== "2004") {
        this.logger.warn("Progress measure is only available in SCORM 2004")
        return false
      }

      progress = Math.max(0, Math.min(1, progress))
      this.logger.debug(`Setting progress: ${progress}`)
      return this.scorm.setValue("cmi.progress_measure", progress.toString())
    }

    setScore(score, maxScore = 100, minScore = 0) {
      this.logger.debug(`Setting score: ${score}`)

      if (this.version === "1.2") {
        this.scorm.setValue("cmi.core.score.raw", score.toString())
        this.scorm.setValue("cmi.core.score.max", maxScore.toString())
        this.scorm.setValue("cmi.core.score.min", minScore.toString())
      } else {
        this.scorm.setValue("cmi.score.raw", score.toString())
        this.scorm.setValue("cmi.score.max", maxScore.toString())
        this.scorm.setValue("cmi.score.min", minScore.toString())

        // Calculate scaled score
        const range = maxScore - minScore
        const scaledScore = range !== 0 ? (score - minScore) / range : 0
        this.scorm.setValue("cmi.score.scaled", scaledScore.toString())
      }

      return true
    }

    setStatus(status) {
      this.logger.debug(`Setting status: ${status}`)

      if (this.version === "1.2") {
        return this.scorm.setValue("cmi.core.lesson_status", status)
      } else {
        if (status === "passed" || status === "failed") {
          this.scorm.setValue("cmi.success_status", status)
          return this.scorm.setValue("cmi.completion_status", "completed")
        } else {
          return this.scorm.setValue("cmi.completion_status", status)
        }
      }
    }

    setSuspendData(data) {
      this.logger.debug(`Setting suspend data: ${data}`)
      return this.scorm.setValue("cmi.suspend_data", data)
    }

    complete(score) {
      this.logger.info("Completing course")

      if (score !== undefined) {
        this.setScore(score)
        this.setStatus(score >= 70 ? "passed" : "failed")
      } else {
        this.setStatus("completed")
      }

      this.setSessionTime()
      this.scorm.commit()

      return true
    }

    setSessionTime() {
      const sessionDuration = Date.now() - this.startTime
      const sessionTime = this.formatTime(sessionDuration)

      this.logger.debug(`Setting session time: ${sessionTime}`)

      if (this.version === "1.2") {
        return this.scorm.setValue("cmi.core.session_time", sessionTime)
      } else {
        return this.scorm.setValue("cmi.session_time", sessionTime)
      }
    }

    formatTime(milliseconds) {
      const seconds = Math.floor(milliseconds / 1000)
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = seconds % 60

      if (this.version === "1.2") {
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      } else {
        return `PT${h}H${m}M${s}S`
      }
    }
  }

  // Export to global namespace
  global.Lumiere = {
    ScormEngine,
    Logger,
    LogLevel,
    CourseTracker,
  }
})(window)
