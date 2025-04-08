import type { QuizConfig, QuizQuestion, QuestionType } from "./QuizManager"
import type { Logger } from "../core/utils/Logger"

/**
 * Interface for quiz template
 */
export interface QuizTemplate {
  id: string
  title: string
  description?: string
  passingScore: number
  randomize?: boolean
  maxAttempts?: number
  timeLimit?: number
  questionTemplates: QuestionTemplate[]
}

/**
 * Interface for question template
 */
export interface QuestionTemplate {
  id: string
  type: QuestionType
  textTemplate: string
  optionsTemplate?: string[]
  correctAnswerTemplate: string | string[]
  feedbackTemplate?: {
    correct?: string
    incorrect?: string
  }
  points: number
  variables?: Record<string, any[]>
}

/**
 * Generator for quizzes and questions
 */
export class QuizGenerator {
  private logger: Logger

  constructor(logger: Logger) {
    this.logger = logger
  }

  /**
   * Generate a quiz from a template
   */
  generateQuiz(template: QuizTemplate): QuizConfig {
    this.logger.info(`Generating quiz from template: ${template.id}`)

    const questions: QuizQuestion[] = []

    for (const questionTemplate of template.questionTemplates) {
      const question = this.generateQuestion(questionTemplate)
      questions.push(question)
    }

    // Randomize questions if specified
    if (template.randomize) {
      this.shuffleArray(questions)
    }

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      passingScore: template.passingScore,
      randomize: template.randomize,
      maxAttempts: template.maxAttempts,
      timeLimit: template.timeLimit,
      questions,
    }
  }

  /**
   * Generate a question from a template
   */
  generateQuestion(template: QuestionTemplate): QuizQuestion {
    this.logger.debug(`Generating question from template: ${template.id}`)

    // Generate variable values
    const variables: Record<string, any> = {}

    if (template.variables) {
      for (const [name, values] of Object.entries(template.variables)) {
        variables[name] = this.getRandomElement(values)
      }
    }

    // Replace variables in text
    const text = this.replaceVariables(template.textTemplate, variables)

    // Replace variables in options
    let options: string[] | undefined
    if (template.optionsTemplate) {
      options = template.optionsTemplate.map((opt) => this.replaceVariables(opt, variables))
    }

    // Replace variables in correct answer
    let correctAnswer: string | string[]
    if (Array.isArray(template.correctAnswerTemplate)) {
      correctAnswer = template.correctAnswerTemplate.map((ans) => this.replaceVariables(ans, variables))
    } else {
      correctAnswer = this.replaceVariables(template.correctAnswerTemplate, variables)
    }

    // Replace variables in feedback
    let feedback: { correct?: string; incorrect?: string } | undefined
    if (template.feedbackTemplate) {
      feedback = {}

      if (template.feedbackTemplate.correct) {
        feedback.correct = this.replaceVariables(template.feedbackTemplate.correct, variables)
      }

      if (template.feedbackTemplate.incorrect) {
        feedback.incorrect = this.replaceVariables(template.feedbackTemplate.incorrect, variables)
      }
    }

    return {
      id: template.id,
      type: template.type,
      text,
      options,
      correctAnswer,
      feedback,
      points: template.points,
    }
  }

  /**
   * Replace variables in a string
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, name) => {
      return variables[name] !== undefined ? variables[name].toString() : match
    })
  }

  /**
   * Get a random element from an array
   */
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  /**
   * Shuffle an array in place
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }
}
