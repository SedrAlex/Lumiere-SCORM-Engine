"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
interface ScormPackagerProps {
  courseData: any
  quizData: any
}

const ScormPackager = ({ courseData, quizData }: ScormPackagerProps) => {
  const [scormVersion, setScormVersion] = useState<"1.2" | "2004">("1.2")
  const [packageTitle, setPackageTitle] = useState(courseData?.title || quizData?.title || "SCORM Package")
  const [packageId, setPackageId] = useState(`SCORM_${Date.now()}`)
  const [packageDescription, setPackageDescription] = useState(courseData?.description || quizData?.description || "")
  const [includeDebugMode, setIncludeDebugMode] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const hasContent = courseData || quizData
  const router = useRouter()
  const navigate = router.push

  const generateScormPackage = async () => {
    if (!hasContent) {
      toast({
        title: "No content to package",
        description: "Please create a course or quiz first.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Create a new JSZip instance
      const zip = new JSZip()

      // Add the imsmanifest.xml file
      zip.file("imsmanifest.xml", generateManifest())

      // Add the SCORM schema files
      if (scormVersion === "1.2") {
        // Add SCORM 1.2 schema files (simplified for this example)
        zip.file("adlcp_rootv1p2.xsd", "<!-- SCORM 1.2 Schema -->")
        zip.file("imscp_rootv1p1p2.xsd", "<!-- IMS Content Packaging Schema -->")
        zip.file("imsmd_rootv1p2p1.xsd", "<!-- IMS Metadata Schema -->")
      } else {
        // Add SCORM 2004 schema files (simplified for this example)
        zip.file("adlcp_v1p3.xsd", "<!-- SCORM 2004 Schema -->")
        zip.file("imscp_v1p1.xsd", "<!-- IMS Content Packaging Schema -->")
        zip.file("imsmd_v1p2.xsd", "<!-- IMS Metadata Schema -->")
      }

      // Create the main HTML file
      zip.file("index.html", generateIndexHtml())

      // Create CSS folder and files
      const cssFolder = zip.folder("css")
      cssFolder?.file("styles.css", generateCssFile())

      // Create JS folder and files
      const jsFolder = zip.folder("js")
      jsFolder?.file("lumiere-scorm-engine.js", generateScormEngineJs())
      jsFolder?.file("course.js", generateCourseJs())

      // Create pages folder and content
      const pagesFolder = zip.folder("pages")

      // Add course pages if available
      if (courseData && courseData.pages) {
        courseData.pages.forEach((page: any, index: number) => {
          pagesFolder?.file(`page${index + 1}.html`, generatePageHtml(page))
        })
      }

      // Add quiz page if available
      if (quizData) {
        pagesFolder?.file("quiz.html", generateQuizHtml(quizData))
      }

      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" })

      // Save the zip file
      saveAs(content, `${packageId}.zip`)

      toast({
        title: "SCORM package generated",
        description: "Your SCORM package has been created successfully.",
      })
    } catch (error) {
      console.error("Error generating SCORM package:", error)
      toast({
        title: "Error generating package",
        description: "An error occurred while generating the SCORM package.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateManifest = () => {
    if (scormVersion === "1.2") {
      return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${packageId}" version="1.0" 
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" 
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
    <adlcp:location>metadata.xml</adlcp:location>
  </metadata>
  <organizations default="${packageId}-ORG">
    <organization identifier="${packageId}-ORG">
      <title>${packageTitle}</title>
      <item identifier="ITEM-1" identifierref="RESOURCE-1">
        <title>${packageTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RESOURCE-1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="css/styles.css"/>
      <file href="js/lumiere-scorm-engine.js"/>
      <file href="js/course.js"/>
      ${courseData && courseData.pages ? courseData.pages.map((_: any, i: number) => `<file href="pages/page${i + 1}.html"/>`).join("\n      ") : ""}
      ${quizData ? '<file href="pages/quiz.html"/>' : ""}
    </resource>
  </resources>
</manifest>`
    } else {
      return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${packageId}" version="1.0"
          xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
          xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
          xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
          xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
                              http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
                              http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
                              http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
                              http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
    <adlcp:location>metadata.xml</adlcp:location>
  </metadata>
  <organizations default="${packageId}-ORG">
    <organization identifier="${packageId}-ORG">
      <title>${packageTitle}</title>
      <item identifier="ITEM-1" identifierref="RESOURCE-1">
        <title>${packageTitle}</title>
        <adlcp:completionThreshold>0.8</adlcp:completionThreshold>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RESOURCE-1" type="webcontent" adlcp:scormType="sco" href="index.html">
      <file href="index.html"/>
      <file href="css/styles.css"/>
      <file href="js/lumiere-scorm-engine.js"/>
      <file href="js/course.js"/>
      ${courseData && courseData.pages ? courseData.pages.map((_: any, i: number) => `<file href="pages/page${i + 1}.html"/>`).join("\n      ") : ""}
      ${quizData ? '<file href="pages/quiz.html"/>' : ""}
    </resource>
  </resources>
</manifest>`
    }
  }

  const generateIndexHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${packageTitle}</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="course-container">
        <header>
            <h1>${packageTitle}</h1>
            <div id="student-info">
                <span id="student-name">Loading...</span>
                <span id="connection-status">Connecting to LMS...</span>
            </div>
        </header>

        <main>
            <div id="content-frame-container">
                <iframe id="content-frame" src="pages/page1.html" allowfullscreen></iframe>
            </div>
            
            <div id="navigation">
                <button id="prev-btn" disabled>Previous</button>
                <div id="progress-indicator">Page 1 of ${(courseData?.pages?.length || 0) + (quizData ? 1 : 0)}</div>
                <button id="next-btn">Next</button>
            </div>
        </main>

        <div id="error-message" class="error-message"></div>
        ${
          includeDebugMode
            ? `
        <div id="debug-panel" class="debug-panel">
            <h3>Debug Information</h3>
            <div id="debug-output"></div>
            <button id="toggle-debug">Toggle Debug Panel</button>
        </div>`
            : ""
        }
    </div>

    <!-- Load the SCORM Engine -->
    <script src="js/lumiere-scorm-engine.js"></script>
    <script src="js/course.js"></script>
</body>
</html>`
  }

  const generateCssFile = () => {
    return `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
}

.course-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

h1 {
  color: #2c3e50;
}

#student-info {
  text-align: right;
}

#student-name {
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
}

#connection-status {
  font-size: 0.9em;
  color: #666;
}

main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

#content-frame-container {
  flex: 1;
  margin-bottom: 20px;
}

#content-frame {
  width: 100%;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

#navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #ddd;
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #2980b9;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  background-color: #fadbd8;
  display: none;
}

.debug-panel {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  display: none;
}

.debug-panel h3 {
  margin-bottom: 10px;
}

#debug-output {
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  background-color: #f1f1f1;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

#toggle-debug {
  background-color: #95a5a6;
  font-size: 14px;
  padding: 5px 10px;
}

#toggle-debug:hover {
  background-color: #7f8c8d;
}`
  }

  const generateScormEngineJs = () => {
    return `// Lumiére SCORM Engine
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
        console.error(\`[SCORM ERROR] \${message}\`)
      }
    }

    warn(message) {
      if (this.level >= LogLevel.WARN) {
        console.warn(\`[SCORM WARNING] \${message}\`)
      }
    }

    info(message) {
      if (this.level >= LogLevel.INFO) {
        console.info(\`[SCORM INFO] \${message}\`)
      }
    }

    debug(message) {
      if (this.level >= LogLevel.DEBUG) {
        console.debug(\`[SCORM DEBUG] \${message}\`)
      }
    }
  }

  // Mock SCORM API
  class ScormEngine {
    constructor(config = {}) {
      this.config = {
        version: "${scormVersion}",
        debugMode: ${includeDebugMode},
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

      this.logger.debug(\`GetValue: \${element}\`)
      return this.data[element] || ""
    }

    setValue(element, value) {
      if (!this.initialized) {
        this.logger.warn("Not initialized")
        return false
      }

      this.logger.debug(\`SetValue: \${element} = \${value}\`)
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
      this.logger.debug(\`Setting location: \${location}\`)

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
      this.logger.debug(\`Setting progress: \${progress}\`)
      return this.scorm.setValue("cmi.progress_measure", progress.toString())
    }

    setScore(score, maxScore = 100, minScore = 0) {
      this.logger.debug(\`Setting score: \${score}\`)

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
      this.logger.debug(\`Setting status: \${status}\`)

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
      this.logger.debug(\`Setting suspend data: \${data}\`)
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

      this.logger.debug(\`Setting session time: \${sessionTime}\`)

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
        return \`\${h.toString().padStart(2, "0")}:\${m.toString().padStart(2, "0")}:\${s.toString().padStart(2, "0")}\`
      } else {
        return \`PT\${h}H\${m}M\${s}S\`
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
})(window)`
  }

  const generateCourseJs = () => {
    return `// Course navigation and SCORM tracking
document.addEventListener("DOMContentLoaded", () => {
  // Course pages
  const pages = [
    ${
      courseData && courseData.pages
        ? courseData.pages
            .map(
              (page: any, index: number) =>
                `{ id: "page${index + 1}", url: "pages/page${index + 1}.html", title: "${page.title}" }`,
            )
            .join(",\n    ")
        : ""
    }
    ${quizData ? `${courseData && courseData.pages.length > 0 ? "," : ""}{ id: "quiz", url: "pages/quiz.html", title: "${quizData.title}" }` : ""}
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
    logEntry.className = \`log-entry log-\${type}\`
    logEntry.innerHTML = \`<span class="log-time">[\${timestamp}]</span> <span class="log-message">\${message}</span>\`
    
    if (debugOutput) {
      debugOutput.appendChild(logEntry)
      debugOutput.scrollTop = debugOutput.scrollHeight
    }

    console.log(\`[\${type.toUpperCase()}] \${message}\`)
  }

  // Toggle debug panel
  if (toggleDebugBtn) {
    toggleDebugBtn.addEventListener("click", () => {
      debugPanel.style.display = debugPanel.style.display === "none" ? "block" : "none"
    })
  }

  // Initialize SCORM
  let scorm, tracker

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
        if (debugPanel) {
          debugPanel.style.display = "block"
        }
        return
      }

      // Detect SCORM version
      const scormVersion = window.parent.API_1484_11 ? "2004" : "1.2"
      log(\`Detected SCORM \${scormVersion}\`, "info")

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
      connectionStatusElement.textContent = \`Connected to LMS (SCORM \${scormVersion})\`
      connectionStatusElement.style.color = "#27ae60"

      // Load last location if available
      const lastLocation = tracker.getTrackingData().location
      if (lastLocation) {
        const pageIndex = pages.findIndex((page) => page.id === lastLocation)
        if (pageIndex !== -1) {
          currentPageIndex = pageIndex
          log(\`Resuming from last location: \${lastLocation}\`, "info")
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
      log(\`SCORM initialization error: \${error.message}\`, "error")
      errorMessageElement.textContent = \`Error: \${error.message}\`
      errorMessageElement.style.display = "block"
      connectionStatusElement.textContent = "Failed to connect to LMS"
      connectionStatusElement.style.color = "#e74c3c"
    }
  }

  // Navigation functions
  function updateNavigation() {
    prevBtn.disabled = currentPageIndex === 0
    nextBtn.disabled = currentPageIndex === pages.length - 1
    progressIndicator.textContent = \`Page \${currentPageIndex + 1} of \${pages.length}\`

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
      log(\`Page completed: \${data.pageId}\`, "info")
      completedPages.add(data.pageId)

      // Update progress if tracker is available
      if (tracker && scorm) {
        const progress = completedPages.size / pages.length
        if (scorm.config.version === "2004") {
          tracker.setProgress(progress)
        }
        scorm.commit()
      }
    } else if (data.action === "quizComplete") {
      log(\`Quiz completed with score: \${data.score}%, Passed: \${data.passed}\`, "info")
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
      completedPages.add(pages[0].id)
      log("First page automatically marked as complete (mock mode)", "info")
    }, 2000)
  }

  // Show debug panel toggle
  if (toggleDebugBtn) {
    toggleDebugBtn.style.display = "block"
  }
})`
  }

  const generatePageHtml = (page: any) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
        }
        h1 {
            color: #333;
        }
        .content {
            max-width: 800px;
            margin: 0 auto;
        }
        .complete-btn {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }
        .complete-btn:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="content">
        <h1>${page.title}</h1>
        <div>${page.content}</div>
        
        <button class="complete-btn" id="mark-complete">Mark Page Complete</button>
    </div>

    <script>
        document.getElementById('mark-complete').addEventListener('click', function() {
            // Notify the parent window that this page is complete
            window.parent.postMessage({
                action: 'pageComplete',
                pageId: '${page.id}'
            }, '*');
            
            this.textContent = 'Page Completed!';
            this.disabled = true;
        });
    </script>
</body>
</html>`
  }

  const generateQuizHtml = (quiz: any) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${quiz.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
        }
        h1 {
            color: #333;
        }
        .content {
            max-width: 800px;
            margin: 0 auto;
        }
        .question {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .options {
            margin-top: 10px;
        }
        .option {
            margin-bottom: 8px;
        }
        .option label {
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        .option input {
            margin-right: 10px;
        }
        .submit-btn {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }
        .submit-btn:hover {
            background-color: #45a049;
        }
        .submit-btn:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        .feedback {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            display: none;
        }
        .correct {
            background-color: #dff0d8;
            color: #3c763d;
        }
        .incorrect {
            background-color: #f2dede;
            color: #a94442;
        }
        #quiz-results {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f5f5f5;
            display: none;
        }
    </style>
</head>
<body>
    <div class="content">
        <h1>${quiz.title}</h1>
        <p>${quiz.description}</p>
        <p>Passing score: ${quiz.passingScore}%</p>
        
        <div id="quiz-container">
            ${quiz.questions
              .map(
                (question: any, qIndex: number) => `
            <div class="question" id="${question.id}">
                <h3>${qIndex + 1}. ${question.text}</h3>
                <div class="options">
                    ${
                      question.type === "multiple_choice" || question.type === "true_false"
                        ? question.options
                            .map(
                              (option: string, oIndex: number) => `
                        <div class="option">
                            <label>
                                <input type="radio" name="${question.id}" value="${oIndex}"> ${option}
                            </label>
                        </div>
                    `,
                            )
                            .join("")
                        : question.type === "multiple_response"
                          ? question.options
                              .map(
                                (option: string, oIndex: number) => `
                        <div class="option">
                            <label>
                                <input type="checkbox" name="${question.id}" value="${oIndex}"> ${option}
                            </label>
                        </div>
                    `,
                              )
                              .join("")
                          : question.type === "fill_in"
                            ? `
                        <div class="option">
                            <input type="text" name="${question.id}" placeholder="Your answer">
                        </div>
                    `
                            : ""
                    }
                </div>
                <div class="feedback" id="feedback-${question.id}"></div>
            </div>
            `,
              )
              .join("")}
            
            <button class="submit-btn" id="submit-quiz">Submit Quiz</button>
        </div>
        
        <div id="quiz-results">
            <h2>Quiz Results</h2>
            <p>Your score: <span id="quiz-score">0</span>%</p>
            <p>Status: <span id="quiz-status">Incomplete</span></p>
            <button class="submit-btn" id="complete-course">Complete Course</button>
        </div>
    </div>

    <script>
        // Quiz data
        const quizData = ${JSON.stringify(quiz.questions)};
        
        // Track answers
        const answers = {};
        
        // Handle form inputs
        document.querySelectorAll('input[type="radio"], input[type="checkbox"], input[type="text"]').forEach(input => {
            input.addEventListener('change', function() {
                const questionId = this.name;
                
                if (this.type === 'radio') {
                    answers[questionId] = this.value;
                } else if (this.type === 'checkbox') {
                    if (!answers[questionId]) {
                        answers[questionId] = [];
                    }
                    
                    if (this.checked) {
                        answers[questionId].push(this.value);
                    } else {
                        const index = answers[questionId].indexOf(this.value);
                        if (index !== -1) {
                            answers[questionId].splice(index, 1);
                        }
                    }
                } else if (this.type === 'text') {
                    answers[questionId] = this.value;
                }
            });
        });
        
        // Submit quiz
        document.getElementById('submit-quiz').addEventListener('click', function() {
            let score = 0;
            let totalPoints = 0;
            
            // Check each question
            quizData.forEach(question => {
                totalPoints += question.points;
                
                const userAnswer = answers[question.id];
                if (!userAnswer) return;
                
                let isCorrect = false;
                
                if (question.type === 'multiple_response') {
                    // For multiple response, check if arrays have the same elements
                    if (Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
                        isCorrect = 
                            userAnswer.length === question.correctAnswer.length &&
                            userAnswer.every(a => question.correctAnswer.includes(a)) &&
                            question.correctAnswer.every(a => userAnswer.includes(a));
                    }
                } else {
                    // For other question types, direct comparison
                    isCorrect = userAnswer === question.correctAnswer;
                }
                
                if (isCorrect) {
                    score += question.points;
                }
                
                // Show feedback
                const feedbackElement = document.getElementById(\`feedback-\${question.id}\`);
                feedbackElement.textContent = isCorrect ? question.feedback.correct : question.feedback.incorrect;
                feedbackElement.className = \`feedback \${isCorrect ? 'correct' : 'incorrect'}\`;
                feedbackElement.style.display = 'block';
            });
            
            // Calculate percentage score
            const percentScore = Math.round((score / totalPoints) * 100);
            const passed = percentScore >= ${quiz.passingScore};
            
            // Display results
            document.getElementById('quiz-score').textContent = percentScore;
            document.getElementById('quiz-status').textContent = passed ? 'Passed' : 'Failed';
            document.getElementById('quiz-results').style.display = 'block';
            
            // Disable submit button
            this.disabled = true;
            
            // Send score to parent window
            window.parent.postMessage({
                action: 'quizComplete',
                score: percentScore,
                passed: passed
            }, '*');
        });
        
        document.getElementById('complete-course').addEventListener('click', function() {
            window.parent.postMessage({
                action: 'courseComplete'
            }, '*');
            
            this.textContent = 'Course Completed!';
            this.disabled = true;
        });
    </script>
</body>
</html>`
  }


}

export default ScormPackager
