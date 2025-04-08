import type { StorageAdapter } from "./StorageAdapter"

/**
 * Storage adapter that uses localStorage
 */
export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string
  private data: Record<string, string> = {}
  private dirty = false

  constructor(prefix = "scorm_") {
    this.prefix = prefix
    this.loadFromStorage()
  }

  /**
   * Get a value from storage
   */
  getValue(key: string): string {
    return this.data[key] || ""
  }

  /**
   * Set a value in storage
   */
  setValue(key: string, value: string): boolean {
    this.data[key] = value
    this.dirty = true
    return true
  }

  /**
   * Commit changes to storage
   */
  commit(): boolean {
    if (this.dirty) {
      try {
        this.saveToStorage()
        this.dirty = false
        return true
      } catch (e) {
        console.error("Error saving to localStorage:", e)
        return false
      }
    }

    return true
  }

  /**
   * Clear all stored data
   */
  clear(): boolean {
    this.data = {}
    this.dirty = true
    return this.commit()
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const storedData = localStorage.getItem(this.prefix + "data")
      if (storedData) {
        this.data = JSON.parse(storedData)
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e)
      this.data = {}
    }
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(): void {
    localStorage.setItem(this.prefix + "data", JSON.stringify(this.data))
  }
}
