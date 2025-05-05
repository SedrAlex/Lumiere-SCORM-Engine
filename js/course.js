// Course navigation and SCORM tracking
document.addEventListener("DOMContentLoaded", () => {
  // Course pages
  const pages = [
    { id: "page1", url: "pages/page1.html", title: "Introduction" },
    { id: "page2", url: "pages/page2.html", title: "SCORM Standards" },
    { id: "quiz", url: "pages/quiz.html", title: "Quiz" },
  ]

  let currentPageIndex = 0
  const completedPages = new Set()

  // DOM elements
  const contentFrame = document.getElementById("content-frame")
  const prevBtn = document.getElementById("prev-btn")
  const nextBtn = document.getElementById("next-btn")
  const progressIndicator = document.getElementById("progress-indicator")
  const studentNameElement = document.getElementById("student-name")
  const connectionStatusElement = document.getElementById("connection-status")
  const errorMessageElement = document.getElementById("error-message")
  const debugOutput = document.getElementById("debug-output")
  const debugPanel = document.getElementById("debug-panel")
  const toggleDebugBtn = document.getElementById("toggle-debug")

  // Debug logging function
  function log(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = document.createElement("div")
    logEntry.className = `log-entry log-${type}`
    logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-message">${message}</span>`
    debugOutput.appendChild(logEntry)
    debugOutput.scrollTop = debugOutput.scrollHeight

    console.log(`[${type.toUpperCase()}] ${message}`)
  }

  // Toggle debug panel
  toggleDebugBtn.addEventListener("click", () => {
    debugPanel.style.display = debugPanel.style.display === "none" ? "block" : "none"
  })

  // Initialize SCORM
  let scorm, tracker
  let Lumiere // Declare Lumiere

  function initScorm() {
    try {
      // Check if we're in an LMS environment
      const inLMS = window.parent !== window && (window.parent.API || window.parent.API_1484_11)

      if (!inLMS) {
        // We're not in an LMS, use mock mode
        log("Not in LMS environment, using mock mode", "warn")
        connectionStatusElement.textContent = "Mock LMS Mode (No real LMS detected)"
        connectionStatusElement.style.color = "#f39c12"

        // Create mock student data
        studentNameElement.textContent = "Test Student"

        // Show debug panel in mock mode
        debugPanel.style.display = "block"
        return
      }

      // Detect SCORM version
      const scormVersion = window.parent.API_1484_11 ? "2004" : "1.2"
      log(`Detected SCORM ${scormVersion}`, "info")

      // Create a logger
      const logger = new Lumiere.Logger(Lumiere.LogLevel.DEBUG, true)

      // Override logger to use our UI
      logger.error = (msg) => log(msg, "error")
      logger.warn = (msg) => log(msg, "warn")
      logger.info = (msg) => log(msg, "info")
      logger.debug = (msg) => log(msg, "debug")

      // Create SCORM engine
      scorm = new Lumiere.ScormEngine({
        version: scormVersion,
        debugMode: true,
        logLevel: Lumiere.LogLevel.DEBUG,
        autoCommitInterval: 30000, // 30 seconds
      })

      // Initialize SCORM connection
      if (!scorm.initialize()) {
        throw new Error("Failed to initialize SCORM connection")
      }

      // Create course tracker
      tracker = new Lumiere.CourseTracker(scorm, logger)

      // Get student name
      const studentName = scorm.getValue(scormVersion === "1.2" ? "cmi.core.student_name" : "cmi.learner_name")
      studentNameElement.textContent = studentName || "Unknown Student"

      // Update connection status
      connectionStatusElement.textContent = `Connected to LMS (SCORM ${scormVersion})`
      connectionStatusElement.style.color = "#27ae60"

      // Load last location if available
      const lastLocation = tracker.getTrackingData().location
      if (lastLocation) {
        const pageIndex = pages.findIndex((page) => page.id === lastLocation)
        if (pageIndex !== -1) {
          currentPageIndex = pageIndex
          log(`Resuming from last location: ${lastLocation}`, "info")
        }
      }

      // Set initial status if not already set
      const status = tracker.getTrackingData().status
      if (!status || status === "not attempted") {
        tracker.setStatus("incomplete")
      }

      // Handle window unload
      window.addEventListener("beforeunload", () => {
        if (scorm) {
          tracker.setSessionTime()
          scorm.commit()
        }
      })

      log("SCORM initialized successfully", "info")
    } catch (error) {
      log(`SCORM initialization error: ${error.message}`, "error")
      errorMessageElement.textContent = `Error: ${error.message}`
      errorMessageElement.style.display = "block"
      connectionStatusElement.textContent = "Failed to connect to LMS"
      connectionStatusElement.style.color = "#e74c3c"
    }
  }

  // Navigation functions
  function updateNavigation() {
    prevBtn.disabled = currentPageIndex === 0
    nextBtn.disabled = currentPageIndex === pages.length - 1
    progressIndicator.textContent = `Page ${currentPageIndex + 1} of ${pages.length}`

    // Load the current page
    contentFrame.src = pages[currentPageIndex].url

    // Update SCORM location if available
    if (tracker) {
      tracker.setLocation(pages[currentPageIndex].id)
      scorm.commit()
    }
  }

  prevBtn.addEventListener("click", () => {
    if (currentPageIndex > 0) {
      currentPageIndex--
      updateNavigation()
    }
  })

  nextBtn.addEventListener("click", () => {
    if (currentPageIndex < pages.length - 1) {
      // Only allow navigation if current page is completed
      if (!completedPages.has(pages[currentPageIndex].id)) {
        alert("Please complete the current page before proceeding.")
        return
      }

      currentPageIndex++
      updateNavigation()
    }
  })

  // Listen for messages from content pages
  window.addEventListener("message", (event) => {
    const data = event.data

    if (data.action === "pageComplete") {
      log(`Page completed: ${data.pageId}`, "info")
      completedPages.add(data.pageId)

      // Update progress if tracker is available
      if (tracker && scorm) {
        const progress = completedPages.size / pages.length
        if (scorm["config"].version === "2004") {
          tracker.setProgress(progress)
        }
        scorm.commit()
      }
    } else if (data.action === "quizComplete") {
      log(`Quiz completed with score: ${data.score}%, Passed: ${data.passed}`, "info")
      completedPages.add("quiz")

      // Update score if tracker is available
      if (tracker && scorm) {
        tracker.setScore(data.score)
        if (data.passed) {
          tracker.setStatus("passed")
        }
        scorm.commit()
      }
    } else if (data.action === "courseComplete") {
      log("Course completed", "info")

      // Mark course as complete if tracker is available
      if (tracker && scorm) {
        tracker.complete()
        scorm.terminate()

        log("SCORM session terminated", "info")
        connectionStatusElement.textContent = "Disconnected from LMS (Course Completed)"
      }
    }
  })

  // Initialize
  initScorm()
  updateNavigation()

  // For testing without an LMS, mark first page as completed
  if (!scorm) {
    setTimeout(() => {
      completedPages.add("page1")
      log("First page automatically marked as complete (mock mode)", "info")
    }, 2000)
  }

  // Show debug panel toggle
  toggleDebugBtn.style.display = "block"
})
