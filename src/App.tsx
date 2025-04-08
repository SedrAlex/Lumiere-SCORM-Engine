"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider"
import Navbar from "./components/Navbar"
import Dashboard from "./pages/Dashboard"
import CourseBuilder from "./pages/CourseBuilder"
import QuizBuilder from "./pages/QuizBuilder"
import CoursePreview from "./pages/CoursePreview"
import ScormPackager from "./pages/ScormPackager"
import { Toaster } from "./components/ui/toaster"
import "./App.css"

function App() {
  const [courseData, setCourseData] = useState<any>(null)
  const [quizData, setQuizData] = useState<any>(null)

  return (
    <ThemeProvider defaultTheme="light" storageKey="lumiere-theme">
      <Router>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto py-6 px-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/course-builder" element={<CourseBuilder setCourseData={setCourseData} />} />
              <Route path="/quiz-builder" element={<QuizBuilder setQuizData={setQuizData} />} />
              <Route path="/preview" element={<CoursePreview courseData={courseData} quizData={quizData} />} />
              <Route path="/package" element={<ScormPackager courseData={courseData} quizData={quizData} />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
