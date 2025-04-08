/**
 * Validator for SCORM data model elements
 */
export class DataModelValidator {
  private scormVersion: "1.2" | "2004"
  private validElements: Set<string>
  private readOnlyElements: Set<string>
  private writeOnlyElements: Set<string>

  constructor(scormVersion: "1.2" | "2004") {
    this.scormVersion = scormVersion
    this.validElements = new Set<string>()
    this.readOnlyElements = new Set<string>()
    this.writeOnlyElements = new Set<string>()

    this.initializeValidElements()
  }

  /**
   * Check if an element is valid for the current SCORM version
   */
  isValidElement(element: string): boolean {
    // Handle array elements (e.g., cmi.objectives.0.id)
    const normalizedElement = this.normalizeArrayElement(element)
    return this.validElements.has(normalizedElement)
  }

  /**
   * Check if an element is read-only
   */
  isReadOnly(element: string): boolean {
    const normalizedElement = this.normalizeArrayElement(element)
    return this.readOnlyElements.has(normalizedElement)
  }

  /**
   * Check if an element is write-only
   */
  isWriteOnly(element: string): boolean {
    const normalizedElement = this.normalizeArrayElement(element)
    return this.writeOnlyElements.has(normalizedElement)
  }

  /**
   * Validate a value for a specific element
   */
  validateValue(element: string, value: string): boolean {
    if (this.isReadOnly(element)) {
      return false
    }

    // Implement specific validation rules for different data model elements
    if (element.startsWith("cmi.core.score") || element.startsWith("cmi.score")) {
      return this.validateScore(element, value)
    }

    if (element === "cmi.core.lesson_status" || element === "cmi.completion_status") {
      return this.validateStatus(element, value)
    }

    // Default to true for elements without specific validation
    return true
  }

  /**
   * Normalize array elements by replacing indices with wildcards
   */
  private normalizeArrayElement(element: string): string {
    // Replace array indices with wildcards (e.g., cmi.objectives.0.id -> cmi.objectives.n.id)
    return element.replace(/\.\d+\./g, ".n.")
  }

  /**
   * Initialize valid elements for the current SCORM version
   */
  private initializeValidElements(): void {
    if (this.scormVersion === "1.2") {
      this.initializeScorm12Elements()
    } else {
      this.initializeScorm2004Elements()
    }
  }

  /**
   * Initialize SCORM 1.2 data model elements
   */
  private initializeScorm12Elements(): void {
    // Core elements
    this.validElements.add("cmi.core.student_id")
    this.validElements.add("cmi.core.student_name")
    this.validElements.add("cmi.core.lesson_location")
    this.validElements.add("cmi.core.credit")
    this.validElements.add("cmi.core.lesson_status")
    this.validElements.add("cmi.core.entry")
    this.validElements.add("cmi.core.score.raw")
    this.validElements.add("cmi.core.score.min")
    this.validElements.add("cmi.core.score.max")
    this.validElements.add("cmi.core.total_time")
    this.validElements.add("cmi.core.lesson_mode")
    this.validElements.add("cmi.core.exit")
    this.validElements.add("cmi.core.session_time")

    // Read-only elements
    this.readOnlyElements.add("cmi.core.student_id")
    this.readOnlyElements.add("cmi.core.student_name")
    this.readOnlyElements.add("cmi.core.credit")
    this.readOnlyElements.add("cmi.core.entry")
    this.readOnlyElements.add("cmi.core.total_time")
    this.readOnlyElements.add("cmi.core.lesson_mode")

    // Write-only elements
    this.writeOnlyElements.add("cmi.core.exit")
    this.writeOnlyElements.add("cmi.core.session_time")

    // Objectives
    this.validElements.add("cmi.objectives.n.id")
    this.validElements.add("cmi.objectives.n.score.raw")
    this.validElements.add("cmi.objectives.n.score.min")
    this.validElements.add("cmi.objectives.n.score.max")
    this.validElements.add("cmi.objectives.n.status")

    // Student data
    this.validElements.add("cmi.student_data.mastery_score")
    this.validElements.add("cmi.student_data.max_time_allowed")
    this.validElements.add("cmi.student_data.time_limit_action")

    // Read-only student data
    this.readOnlyElements.add("cmi.student_data.mastery_score")
    this.readOnlyElements.add("cmi.student_data.max_time_allowed")
    this.readOnlyElements.add("cmi.student_data.time_limit_action")

    // Suspend data
    this.validElements.add("cmi.suspend_data")

    // Launch data
    this.validElements.add("cmi.launch_data")
    this.readOnlyElements.add("cmi.launch_data")

    // Comments
    this.validElements.add("cmi.comments")
    this.validElements.add("cmi.comments_from_lms")
    this.readOnlyElements.add("cmi.comments_from_lms")
  }

  /**
   * Initialize SCORM 2004 data model elements
   */
  private initializeScorm2004Elements(): void {
    // Learner information
    this.validElements.add("cmi._version")
    this.validElements.add("cmi.learner_id")
    this.validElements.add("cmi.learner_name")
    this.validElements.add("cmi.learner_preference.audio_level")
    this.validElements.add("cmi.learner_preference.language")
    this.validElements.add("cmi.learner_preference.delivery_speed")
    this.validElements.add("cmi.learner_preference.audio_captioning")

    // Read-only elements
    this.readOnlyElements.add("cmi._version")
    this.readOnlyElements.add("cmi.learner_id")
    this.readOnlyElements.add("cmi.learner_name")

    // Session information
    this.validElements.add("cmi.completion_status")
    this.validElements.add("cmi.success_status")
    this.validElements.add("cmi.entry")
    this.validElements.add("cmi.exit")
    this.validElements.add("cmi.session_time")

    this.readOnlyElements.add("cmi.entry")
    this.writeOnlyElements.add("cmi.exit")
    this.writeOnlyElements.add("cmi.session_time")

    // Location and progress
    this.validElements.add("cmi.location")
    this.validElements.add("cmi.progress_measure")

    // Score
    this.validElements.add("cmi.score.scaled")
    this.validElements.add("cmi.score.raw")
    this.validElements.add("cmi.score.min")
    this.validElements.add("cmi.score.max")

    // Objectives
    this.validElements.add("cmi.objectives.n.id")
    this.validElements.add("cmi.objectives.n.score.scaled")
    this.validElements.add("cmi.objectives.n.score.raw")
    this.validElements.add("cmi.objectives.n.score.min")
    this.validElements.add("cmi.objectives.n.score.max")
    this.validElements.add("cmi.objectives.n.success_status")
    this.validElements.add("cmi.objectives.n.completion_status")
    this.validElements.add("cmi.objectives.n.progress_measure")
    this.validElements.add("cmi.objectives.n.description")

    // Interactions
    this.validElements.add("cmi.interactions.n.id")
    this.validElements.add("cmi.interactions.n.type")
    this.validElements.add("cmi.interactions.n.objectives.n.id")
    this.validElements.add("cmi.interactions.n.timestamp")
    this.validElements.add("cmi.interactions.n.correct_responses.n.pattern")
    this.validElements.add("cmi.interactions.n.weighting")
    this.validElements.add("cmi.interactions.n.learner_response")
    this.validElements.add("cmi.interactions.n.result")
    this.validElements.add("cmi.interactions.n.latency")
    this.validElements.add("cmi.interactions.n.description")

    // Suspend data
    this.validElements.add("cmi.suspend_data")

    // Launch data
    this.validElements.add("cmi.launch_data")
    this.readOnlyElements.add("cmi.launch_data")

    // Comments
    this.validElements.add("cmi.comments_from_learner.n.comment")
    this.validElements.add("cmi.comments_from_learner.n.location")
    this.validElements.add("cmi.comments_from_learner.n.timestamp")
    this.validElements.add("cmi.comments_from_lms.n.comment")
    this.validElements.add("cmi.comments_from_lms.n.location")
    this.validElements.add("cmi.comments_from_lms.n.timestamp")

    this.readOnlyElements.add("cmi.comments_from_lms.n.comment")
    this.readOnlyElements.add("cmi.comments_from_lms.n.location")
    this.readOnlyElements.add("cmi.comments_from_lms.n.timestamp")
  }

  /**
   * Validate score values
   */
  private validateScore(element: string, value: string): boolean {
    // Check if value is a valid number
    if (isNaN(Number(value))) {
      return false
    }

    // For scaled scores in SCORM 2004, value must be between -1 and 1
    if (element === "cmi.score.scaled" || element.endsWith(".score.scaled")) {
      const numValue = Number(value)
      return numValue >= -1 && numValue <= 1
    }

    return true
  }

  /**
   * Validate status values
   */
  private validateStatus(element: string, value: string): boolean {
    if (this.scormVersion === "1.2" && element === "cmi.core.lesson_status") {
      const validStatuses = ["passed", "completed", "failed", "incomplete", "browsed", "not attempted"]
      return validStatuses.includes(value)
    }

    if (this.scormVersion === "2004") {
      if (element === "cmi.completion_status") {
        const validStatuses = ["completed", "incomplete", "not attempted", "unknown"]
        return validStatuses.includes(value)
      }

      if (element === "cmi.success_status") {
        const validStatuses = ["passed", "failed", "unknown"]
        return validStatuses.includes(value)
      }
    }

    return true
  }
}
