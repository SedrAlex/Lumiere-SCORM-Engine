import { ScormEngine, ScormEngineConfig } from "./core/ScormEngine"
import { Logger, LogLevel } from "./core/utils/Logger"
import { StorageAdapter } from "./core/storage/StorageAdapter"
import { LocalStorageAdapter } from "./core/storage/LocalStorageAdapter"
import { ManifestParser } from "./package/ManifestParser"
import { PackageLoader } from "./package/PackageLoader"
import { CourseTracker } from "./tracking/CourseTracker"
import { QuizManager, QuizConfig, QuestionType } from "./quiz/QuizManager"
import { QuizGenerator } from "./quiz/QuizGenerator"

/**
 * Main export for the Lumiére SCORM Engine
 */
export {
  // Core
  ScormEngine,
  ScormEngineConfig,
  Logger,
  LogLevel,
  // Storage
  StorageAdapter,
  LocalStorageAdapter,
  // Package
  ManifestParser,
  PackageLoader,
  // Tracking
  CourseTracker,
  // Quiz
  QuizManager,
  QuizGenerator,
  QuizConfig,
  QuestionType,
}

/**
 * Example usage
 */
export const createScormEngine = (config: ScormEngineConfig = {}): ScormEngine => {
  return new ScormEngine(config)
}
