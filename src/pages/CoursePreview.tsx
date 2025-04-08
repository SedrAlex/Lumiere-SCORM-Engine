"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Package } from "lucide-react"

interface CoursePreviewProps {
  courseData: any
  quizData: any
}

const CoursePreview = ({ courseData, quizData }: CoursePreviewProps) => {
  const navigate = useNavigate()
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [completedPages, setCompletedPages] = useState<Set<number>>(new Set())
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | string[]>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizPassed, setQuizPassed] = useState(false)

  // Combine course pages and quiz into a single content array
  const content = [
    ...(courseData?.pages || []).map((page: any) => ({ type: "page", ...page })),
    ...(quizData ? [{ type: "quiz", ...quizData }] : []),
  ]

  useEffect(() => {
    // Reset state when content changes
    setCurrentPageIndex(0)
    setCompletedPages(new Set())
    setQuizAnswers({})
    setQuizSubmitted(false)
  }, [courseData, quizData])

  if (!courseData && !quizData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">No Content to Preview</h1>
        <p className="text-muted-foreground">Please create a course or quiz first.</p>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/course-builder")}>Create Course</Button>
          <Button onClick={() => navigate("/quiz-builder")}>Create Quiz</Button>
        </div>
      </div>
    )
  }

  const currentContent = content[currentPageIndex]

  const handlePageComplete = () => {
    const updatedCompleted = new Set(completedPages)
    updatedCompleted.add(currentPageIndex)
    setCompletedPages(updatedCompleted)
  }

  const handleQuizAnswer = (questionId: string, answer: string | string[]) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: answer,
    })
  }

  const handleQuizSubmit = () => {
    if (!quizData) return

    let correctCount = 0
    let totalPoints = 0

    quizData.questions.forEach((question: any) => {
      totalPoints += question.points

      const userAnswer = quizAnswers[question.id]
      if (!userAnswer) return

      let isCorrect = false

      if (question.type === "multiple_response") {
        // For multiple response, check if arrays have the same elements
        if (Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
          isCorrect =
            userAnswer.length === question.correctAnswer.length &&
            userAnswer.every((a) => question.correctAnswer.includes(a)) &&
            question.correctAnswer.every((a) => userAnswer.includes(a))
        }
      } else {
        // For other question types, direct comparison
        isCorrect = userAnswer === question.correctAnswer
      }

      if (isCorrect) {
        correctCount += question.points
      }
    })

    const score = Math.round((correctCount / totalPoints) * 100)
    const passed = score >= quizData.passingScore

    setQuizScore(score)
    setQuizPassed(passed)
    setQuizSubmitted(true)

    // Mark quiz as completed
    const updatedCompleted = new Set(completedPages)
    updatedCompleted.add(currentPageIndex)
    setCompletedPages(updatedCompleted)
  }

  const goToPackager = () => {
    navigate("/package")
  }

  const renderPageContent = () => {
    if (currentContent.type === "page") {
      return (
        <div className="space-y-4">
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: currentContent.content }}
          />

          {!completedPages.has(currentPageIndex) && <Button onClick={handlePageComplete}>Mark as Complete</Button>}

          {completedPages.has(currentPageIndex) && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md">
              Page completed
            </div>
          )}
        </div>
      )
    } else if (currentContent.type === "quiz") {
      return (
        <div className="space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <h1>{currentContent.title}</h1>
            <p>{currentContent.description}</p>
            <p>Passing score: {currentContent.passingScore}%</p>
          </div>

          {quizSubmitted ? (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-md ${quizPassed ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}
              >
                <h2 className="text-xl font-bold">Quiz Results</h2>
                <p>Your score: {quizScore}%</p>
                <p>Status: {quizPassed ? "Passed" : "Failed"}</p>
              </div>

              {currentContent.questions.map((question: any, qIndex: number) => {
                const userAnswer = quizAnswers[question.id]
                let isCorrect = false

                if (question.type === "multiple_response") {
                  if (Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
                    isCorrect =
                      userAnswer.length === question.correctAnswer.length &&
                      userAnswer.every((a) => question.correctAnswer.includes(a)) &&
                      question.correctAnswer.every((a) => userAnswer.includes(a))
                  }
                } else {
                  isCorrect = userAnswer === question.correctAnswer
                }

                return (
                  <div key={question.id} className="border rounded-md p-4">
                    <h3 className="font-medium">
                      {qIndex + 1}. {question.text}
                    </h3>

                    {question.type === "multiple_choice" || question.type === "true_false" ? (
                      <div className="mt-2 space-y-2">
                        {question.options.map((option: string, oIndex: number) => (
                          <div
                            key={oIndex}
                            className={`p-2 rounded-md ${
                              userAnswer === oIndex.toString()
                                ? isCorrect
                                  ? "bg-green-50 dark:bg-green-900/20"
                                  : "bg-red-50 dark:bg-red-900/20"
                                : question.correctAnswer === oIndex.toString()
                                  ? "bg-green-50 dark:bg-green-900/20"
                                  : ""
                            }`}
                          >
                            {option}
                            {userAnswer === oIndex.toString() && !isCorrect && (
                              <span className="ml-2 text-red-500">✗</span>
                            )}
                            {question.correctAnswer === oIndex.toString() && (
                              <span className="ml-2 text-green-500">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : question.type === "multiple_response" ? (
                      <div className="mt-2 space-y-2">
                        {question.options.map((option: string, oIndex: number) => (
                          <div
                            key={oIndex}
                            className={`p-2 rounded-md ${
                              Array.isArray(userAnswer) && userAnswer.includes(oIndex.toString())
                                ? Array.isArray(question.correctAnswer) &&
                                  question.correctAnswer.includes(oIndex.toString())
                                  ? "bg-green-50 dark:bg-green-900/20"
                                  : "bg-red-50 dark:bg-red-900/20"
                                : Array.isArray(question.correctAnswer) &&
                                    question.correctAnswer.includes(oIndex.toString())
                                  ? "bg-green-50 dark:bg-green-900/20"
                                  : ""
                            }`}
                          >
                            {option}
                            {Array.isArray(userAnswer) &&
                              userAnswer.includes(oIndex.toString()) &&
                              !(
                                Array.isArray(question.correctAnswer) &&
                                question.correctAnswer.includes(oIndex.toString())
                              ) && <span className="ml-2 text-red-500">✗</span>}
                            {Array.isArray(question.correctAnswer) &&
                              question.correctAnswer.includes(oIndex.toString()) && (
                                <span className="ml-2 text-green-500">✓</span>
                              )}
                          </div>
                        ))}
                      </div>
                    ) : question.type === "fill_in" ? (
                      <div className="mt-2 space-y-2">
                        <div
                          className={`p-2 rounded-md ${
                            isCorrect ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
                          }`}
                        >
                          Your answer: {userAnswer as string}
                          {isCorrect ? (
                            <span className="ml-2 text-green-500">✓</span>
                          ) : (
                            <>
                              <span className="ml-2 text-red-500">✗</span>
                              <div className="mt-1 text-green-600 dark:text-green-400">
                                Correct answer: {question.correctAnswer as string}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-2 text-sm">
                      {isCorrect ? (
                        <div className="text-green-600 dark:text-green-400">{question.feedback.correct}</div>
                      ) : (
                        <div className="text-red-600 dark:text-red-400">{question.feedback.incorrect}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {currentContent.questions.map((question: any, qIndex: number) => (
                <Card key={question.id}>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-medium">
                      {qIndex + 1}. {question.text}
                    </h3>

                    {question.type === "multiple_choice" || question.type === "true_false" ? (
                      <div className="space-y-2">
                        {question.options.map((option: string, oIndex: number) => (
                          <div key={oIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`${question.id}-option-${oIndex}`}
                              name={question.id}
                              value={oIndex.toString()}
                              checked={quizAnswers[question.id] === oIndex.toString()}
                              onChange={() => handleQuizAnswer(question.id, oIndex.toString())}
                              className="h-4 w-4"
                            />
                            <label htmlFor={`${question.id}-option-${oIndex}`}>{option}</label>
                          </div>
                        ))}
                      </div>
                    ) : question.type === "multiple_response" ? (
                      <div className="space-y-2">
                        {question.options.map((option: string, oIndex: number) => (
                          <div key={oIndex} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`${question.id}-option-${oIndex}`}
                              value={oIndex.toString()}
                              checked={
                                Array.isArray(quizAnswers[question.id]) &&
                                quizAnswers[question.id].includes(oIndex.toString())
                              }
                              onChange={(e) => {
                                const currentAnswers = Array.isArray(quizAnswers[question.id])
                                  ? [...(quizAnswers[question.id] as string[])]
                                  : []

                                if (e.target.checked) {
                                  currentAnswers.push(oIndex.toString())
                                } else {
                                  const answerIndex = currentAnswers.indexOf(oIndex.toString())
                                  if (answerIndex !== -1) {
                                    currentAnswers.splice(answerIndex, 1)
                                  }
                                }

                                handleQuizAnswer(question.id, currentAnswers)
                              }}
                              className="h-4 w-4"
                            />
                            <label htmlFor={`${question.id}-option-${oIndex}`}>{option}</label>
                          </div>
                        ))}
                      </div>
                    ) : question.type === "fill_in" ? (
                      <div>
                        <input
                          type="text"
                          value={(quizAnswers[question.id] as string) || ""}
                          onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                          className="w-full p-2 border rounded-md"
                          placeholder="Your answer"
                        />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}

              <Button
                onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length < currentContent.questions.length}
              >
                Submit Quiz
              </Button>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {courseData ? courseData.title : quizData ? quizData.title : "Preview"}
        </h1>
        <Button variant="outline" onClick={goToPackager} className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Package as SCORM
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted p-3 font-medium">Content</div>
            <div className="divide-y">
              {content.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 cursor-pointer ${index === currentPageIndex ? "bg-primary/10 font-medium" : ""} ${
                    completedPages.has(index) ? "text-green-600 dark:text-green-400" : ""
                  }`}
                  onClick={() => setCurrentPageIndex(index)}
                >
                  {item.type === "page" ? item.title : item.title}
                  {completedPages.has(index) && " ✓"}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <div className="min-h-[50vh]">
                <h2 className="text-2xl font-bold mb-4">{currentContent.title}</h2>
                {renderPageContent()}
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPageIndex((prev) => prev - 1)}
                  disabled={currentPageIndex === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  onClick={() => setCurrentPageIndex((prev) => prev + 1)}
                  disabled={currentPageIndex === content.length - 1 || !completedPages.has(currentPageIndex)}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CoursePreview
