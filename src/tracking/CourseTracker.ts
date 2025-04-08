import type { ScormEngine } from "../core/ScormEngine"
import type { Logger } from "../core/utils/Logger"

/**
 * Interface for course tracking data
 */
export interface CourseTrackingData {
  location: string
  progress: number
  score: number
  maxScore: number
  minScore: number
  status: string
  suspendData: string
  sessionTime: string
  totalTime: string
}

/**
 * Course tracker for managing student progress
 */
export class CourseTracker {
  private scorm: ScormEngine
  private logger: Logger
  private version: "1.2" | "2004"
  private startTime: number

  constructor(scorm: ScormEngine, logger: Logger) {
    this.scorm = scorm
    this.logger = logger
    this.version = scorm["config"].version || "1.2"
    this.startTime = Date.now()
  }

  /**
   * Initialize the course tracker
   */
  initialize(): boolean {
    this.logger.info("Initializing course tracker")
    this.startTime = Date.now()
    return true
  }

  /**
   * Get the current tracking data
   */
  getTrackingData(): CourseTrackingData {
    const version = this.version

    if (version === "1.2") {
      return {
        location: this.scorm.getValue("cmi.core.lesson_location"),
        progress: 0, // Not directly available in SCORM 1.2
        score: Number.parseFloat(this.scorm.getValue("cmi.core.score.raw") || "0"),
        maxScore: Number.parseFloat(this.scorm.getValue("cmi.core.score.max") || "100"),
        minScore: Number.parseFloat(this.scorm.getValue("cmi.core.score.min") || "0"),
        status: this.scorm.getValue("cmi.core.lesson_status"),
        suspendData: this.scorm.getValue("cmi.suspend_data"),
        sessionTime: this.scorm.getValue("cmi.core.session_time"),
        totalTime: this.scorm.getValue("cmi.core.total_time"),
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
        sessionTime: this.scorm.getValue("cmi.session_time"),
        totalTime: this.scorm.getValue("cmi.total_time"),
      }
    }
  }

  /**
   * Set the current location (bookmark)
   */
  setLocation(location: string): boolean {
    this.logger.debug(`Setting location: ${location}`)

    if (this.version === "1.2") {
      return this.scorm.setValue("cmi.core.lesson_location", location)
    } else {
      return this.scorm.setValue("cmi.location", location)
    }
  }

  /**
   * Set the progress measure (SCORM 2004 only)
   */
  setProgress(progress: number): boolean {
    if (this.version !== "2004") {
      this.logger.warn("Progress measure is only available in SCORM 2004")
      return false
    }

    // Ensure progress is between 0 and 1
    progress = Math.max(0, Math.min(1, progress))

    this.logger.debug(`Setting progress: ${progress}`)
    return this.scorm.setValue("cmi.progress_measure", progress.toString())
  }

  /**
   * Set the score
   */
  setScore(score: number, maxScore = 100, minScore = 0): boolean {
    this.logger.debug(`Setting score: ${score} (min: ${minScore}, max: ${maxScore})`)

    let success = true

    if (this.version === "1.2") {
      success = this.scorm.setValue("cmi.core.score.raw", score.toString()) && success
      success = this.scorm.setValue("cmi.core.score.max", maxScore.toString()) && success
      success = this.scorm.setValue("cmi.core.score.min", minScore.toString()) && success
    } else {
      success = this.scorm.setValue("cmi.score.raw", score.toString()) && success
      success = this.scorm.setValue("cmi.score.max", maxScore.toString()) && success
      success = this.scorm.setValue("cmi.score.min", minScore.toString()) && success

      // Calculate and set scaled score (required for SCORM 2004)
      const range = maxScore - minScore
      const scaledScore = range !== 0 ? (score - minScore) / range : 0
      success = this.scorm.setValue("cmi.score.scaled", scaledScore.toString()) && success
    }

    return success
  }

  /**
   * Set the completion status
   */
  setStatus(status: string): boolean {
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

  /**
   * Set the suspend data
   */
  setSuspendData(data: string): boolean {
    this.logger.debug(`Setting suspend data: ${data}`)
    return this.scorm.setValue("cmi.suspend_data", data)
  }

  /**
   * Complete the course
   */
  complete(score?: number): boolean {
    this.logger.info("Completing course")

    let success = true

    // Set status
    if (this.version === "1.2") {
      if (score !== undefined) {
        const passingScore = Number.parseFloat(this.scorm.getValue("cmi.student_data.mastery_score") || "0")
        const status = score >= passingScore ? "passed" : "failed"
        success = this.setStatus(status) && success
      } else {
        success = this.setStatus("completed") && success
      }
    } else {
      if (score !== undefined) {
        const passingScore = Number.parseFloat(this.scorm.getValue("cmi.scaled_passing_score") || "0.8")
        const scaledScore = score / 100 // Assuming score is on a 0-100 scale
        const successStatus = scaledScore >= passingScore ? "passed" : "failed"

        success = this.scorm.setValue("cmi.success_status", successStatus) && success
      }

      success = this.scorm.setValue("cmi.completion_status", "completed") && success
      success = this.setProgress(1) && success
    }

    // Set session time
    success = this.setSessionTime() && success

    // Commit changes
    success = this.scorm.commit() && success

    return success
  }

  /**
   * Calculate and set the session time
   */
  setSessionTime(): boolean {
    const sessionDuration = Date.now() - this.startTime
    const sessionTime = this.formatTime(sessionDuration)

    this.logger.debug(`Setting session time: ${sessionTime}`)

    if (this.version === "1.2") {
      return this.scorm.setValue("cmi.core.session_time", sessionTime)
    } else {
      return this.scorm.setValue("cmi.session_time", sessionTime)
    }
  }

  /**
   * Format time according to SCORM requirements
   */
  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    if (this.version === "1.2") {
      // SCORM 1.2 format: HH:MM:SS
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    } else {
      // SCORM 2004 format: PT#H#M#S
      return `PT${h}H${m}M${s}S`
    }
  }
}
