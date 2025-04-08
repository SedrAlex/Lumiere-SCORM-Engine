import type { Logger } from "../core/utils/Logger"
import type { CourseTracker } from "../tracking/CourseTracker"

/**
 * Interface for quiz question
 */
export interface QuizQuestion {
  id: string
  type: QuestionType
  text: string
  options?: string[]
  correctAnswer: string | string[]
  feedback?: {
    correct?: string
    incorrect?: string
  }
  points: number
}

/**
 * Interface for quiz configuration
 */
export interface QuizConfig {
  id: string
  title: string
  description?: string
  passingScore: number
  randomize?: boolean
  maxAttempts?: number
  timeLimit?: number
  questions: QuizQuestion[]
}

/**
 * Interface for quiz attempt
 */
export interface QuizAttempt {
  startTime: number
  endTime?: number
  answers: Record<string, string | string[]>
  score?: number
  passed?: boolean
}

/**
 * Enum for question types
 */
export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  MULTIPLE_RESPONSE = "multiple_response",
  TRUE_FALSE = "true_false",
  FILL_IN = "fill_in",
  MATCHING = "matching",
  SEQUENCING = "sequencing",
}

/**
 * Manager for quizzes and assessments
 */
export class QuizManager {
  private logger: Logger
  private tracker: CourseTracker
  private config: QuizConfig
  private currentAttempt: QuizAttempt | null = null
  private attempts: QuizAttempt[] = []

  constructor(config: QuizConfig, tracker: CourseTracker, logger: Logger) {
    this.config = config
    this.tracker = tracker
    this.logger = logger

    // Load previous attempts from suspend data
    this.loadAttempts()
  }

  /**
   * Start a new quiz attempt
   */
  startAttempt(): QuizAttempt {
    this.logger.info(`Starting new attempt for quiz: ${this.config.id}`)

    // Check if max attempts has been reached
    if (this.config.maxAttempts && this.attempts.length >= this.config.maxAttempts) {
      this.logger.warn(`Maximum attempts (${this.config.maxAttempts}) reached for quiz: ${this.config.id}`)
      throw new Error(`Maximum attempts (${this.config.maxAttempts}) reached`)
    }

    // Create a new attempt
    this.currentAttempt = {
      startTime: Date.now(),
      answers: {},
    }

    return this.currentAttempt
  }

  /**
   * Get the current quiz attempt
   */
  getCurrentAttempt(): QuizAttempt | null {
    return this.currentAttempt
  }

  /**
   * Get all quiz attempts
   */
  getAttempts(): QuizAttempt[] {
    return this.attempts
  }

  /**
   * Answer a question in the current attempt
   */
  answerQuestion(questionId: string, answer: string | string[]): boolean {
    if (!this.currentAttempt) {
      this.logger.error("No active quiz attempt")
      return false
    }

    this.logger.debug(`Answering question ${questionId}: ${JSON.stringify(answer)}`)

    // Find the question
    const question = this.config.questions.find((q) => q.id === questionId)
    if (!question) {
      this.logger.error(`Question not found: ${questionId}`)
      return false
    }

    // Store the answer
    this.currentAttempt.answers[questionId] = answer

    return true
  }

  /**
   * Submit the current quiz attempt
   */
  submitAttempt(): QuizAttempt {
    if (!this.currentAttempt) {
      this.logger.error("No active quiz attempt")
      throw new Error("No active quiz attempt")
    }

    this.logger.info(`Submitting attempt for quiz: ${this.config.id}`)

    // Calculate score
    const { score, passed } = this.calculateScore(this.currentAttempt)

    // Update the attempt
    this.currentAttempt.endTime = Date.now()
    this.currentAttempt.score = score
    this.currentAttempt.passed = passed

    // Add to attempts
    this.attempts.push(this.currentAttempt)

    // Save attempts to suspend data
    this.saveAttempts()

    // Update SCORM data
    this.tracker.setScore(score, 100, 0)

    if (passed) {
      this.tracker.setStatus("passed")
    } else if (this.config.maxAttempts && this.attempts.length >= this.config.maxAttempts) {
      this.tracker.setStatus("failed")
    }

    const result = { ...this.currentAttempt }
    this.currentAttempt = null

    return result
  }

  /**
   * Calculate the score for an attempt
   */
  calculateScore(attempt: QuizAttempt): { score: number; passed: boolean } {
    let totalPoints = 0
    let earnedPoints = 0

    for (const question of this.config.questions) {
      totalPoints += question.points

      const answer = attempt.answers[question.id]
      if (answer === undefined) {
        continue
      }

      if (this.isAnswerCorrect(question, answer)) {
        earnedPoints += question.points
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const passed = score >= this.config.passingScore

    return { score, passed }
  }

  /**
   * Check if an answer is correct
   */
  isAnswerCorrect(question: QuizQuestion, answer: string | string[]): boolean {
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.TRUE_FALSE:
      case QuestionType.FILL_IN:
        return answer === question.correctAnswer

      case QuestionType.MULTIPLE_RESPONSE:
        if (!Array.isArray(answer) || !Array.isArray(question.correctAnswer)) {
          return false
        }

        // Check if arrays have the same elements
        if (answer.length !== question.correctAnswer.length) {
          return false
        }

        return (
          answer.every((a) => question.correctAnswer.includes(a)) &&
          question.correctAnswer.every((a) => answer.includes(a))
        )

      case QuestionType.MATCHING:
      case QuestionType.SEQUENCING:
        // For these types, we expect the answer to be a string representation
        // of the correct sequence or matching
        return JSON.stringify(answer) === JSON.stringify(question.correctAnswer)

      default:
        return false
    }
  }

  /**
   * Get feedback for a question
   */
  getFeedback(questionId: string, answer: string | string[]): string | undefined {
    const question = this.config.questions.find((q) => q.id === questionId)
    if (!question || !question.feedback) {
      return undefined
    }

    const isCorrect = this.isAnswerCorrect(question, answer)
    return isCorrect ? question.feedback.correct : question.feedback.incorrect
  }

  /**
   * Save attempts to suspend data
   */
  private saveAttempts(): void {
    try {
      const attemptsData = JSON.stringify(this.attempts)
      this.tracker.setSuspendData(attemptsData)
    } catch (e) {
      this.logger.error(`Error saving attempts: ${e}`)
    }
  }

  /**
   * Load attempts from suspend data
   */
  private loadAttempts(): void {
    try {
      const suspendData = this.tracker.getTrackingData().suspendData
      if (suspendData) {
        this.attempts = JSON.parse(suspendData)
      }
    } catch (e) {
      this.logger.error(`Error loading attempts: ${e}`)
      this.attempts = []
    }
  }
}
