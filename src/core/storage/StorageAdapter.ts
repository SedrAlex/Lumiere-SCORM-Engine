/**
 * Interface for storage adapters
 */
export interface StorageAdapter {
  /**
   * Get a value from storage
   */
  getValue(key: string): string

  /**
   * Set a value in storage
   */
  setValue(key: string, value: string): boolean

  /**
   * Commit changes to storage
   */
  commit(): boolean

  /**
   * Clear all stored data
   */
  clear(): boolean
}
