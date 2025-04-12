"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Trash2, Save, Eye } from "lucide-react"
import { toast } from "sonner"

interface QuizBuilderProps {
  setQuizData: (data: any) => void
}

const QuizBuilder = ({ setQuizData }: QuizBuilderProps) => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [quizTitle, setQuizTitle] = useState("Knowledge Check")
  const [quizDescription, setQuizDescription] = useState("Test your knowledge with this quiz")
  const [passingScore, setPassingScore] = useState(70)
  const [randomize, setRandomize] = useState(false)
  const [maxAttempts, setMaxAttempts] = useState(2)

  const [questions, setQuestions] = useState([
    {
      id: "q1",
      type: "multiple_choice",
      text: "What does SCORM stand for?",
      options: [
        "Standardized Content Object Reference Model",
        "Shareable Content Object Reference Model",
        "System Content Organization Reference Method",
        "Structured Course Object Reference Mechanism",
      ],
      correctAnswer: "1",
      feedback: {
        correct: "Correct! SCORM stands for Shareable Content Object Reference Model.",
        incorrect: "Incorrect. SCORM stands for Shareable Content Object Reference Model.",
      },
      points: 10,
    },
  ])

  const questionTypes = [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "true_false", label: "True/False" },
    { value: "multiple_response", label: "Multiple Response" },
    { value: "fill_in", label: "Fill in the Blank" },
  ]

  const addQuestion = () => {
    const newQuestionId = `q${questions.length + 1}`
    setQuestions([
      ...questions,
      {
        id: newQuestionId,
        type: "multiple_choice",
        text: "New Question",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: "0",
        feedback: {
          correct: "Correct!",
          incorrect: "Incorrect.",
        },
        points: 10,
      },
    ])
  }

  const updateQuestionType = (index: number, type: string) => {
    const updatedQuestions = [...questions]

    // Update the question type
    updatedQuestions[index].type = type

    // Reset options and correct answer based on type
    if (type === "true_false") {
      updatedQuestions[index].options = ["True", "False"]
      updatedQuestions[index].correctAnswer = "0"
    } else if (type === "multiple_choice") {
      if (!Array.isArray(updatedQuestions[index].options) || updatedQuestions[index].options.length < 2) {
        updatedQuestions[index].options = ["Option 1", "Option 2", "Option 3", "Option 4"]
      }
      updatedQuestions[index].correctAnswer = "0"
    } else if (type === "multiple_response") {
      if (!Array.isArray(updatedQuestions[index].options) || updatedQuestions[index].options.length < 2) {
        updatedQuestions[index].options = ["Option 1", "Option 2", "Option 3", "Option 4"]
      }
      updatedQuestions[index].correctAnswer = ["0", "1"]
    } else if (type === "fill_in") {
      updatedQuestions[index].options = []
      updatedQuestions[index].correctAnswer = "answer"
    }

    setQuestions(updatedQuestions)
  }

  const updateQuestionText = (index: number, text: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index].text = text
    setQuestions(updatedQuestions)
  }

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = []
    }
    updatedQuestions[questionIndex].options[optionIndex] = value
    setQuestions(updatedQuestions)
  }

  const updateCorrectAnswer = (index: number, value: string | string[]) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index].correctAnswer = value
    setQuestions(updatedQuestions)
  }

  const updateFeedback = (index: number, type: "correct" | "incorrect", value: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index].feedback[type] = value
    setQuestions(updatedQuestions)
  }

  const updatePoints = (index: number, points: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index].points = points
    setQuestions(updatedQuestions)
  }

  const addOption = (index: number) => {
    const updatedQuestions = [...questions]
    if (!updatedQuestions[index].options) {
      updatedQuestions[index].options = []
    }
    updatedQuestions[index].options.push(`Option ${updatedQuestions[index].options.length + 1}`)
    setQuestions(updatedQuestions)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options.splice(optionIndex, 1)

    // Update correct answer if needed
    if (updatedQuestions[questionIndex].type === "multiple_choice") {
      const correctAnswerIndex = Number.parseInt(updatedQuestions[questionIndex].correctAnswer as string)
      if (correctAnswerIndex === optionIndex) {
        updatedQuestions[questionIndex].correctAnswer = "0"
      } else if (correctAnswerIndex > optionIndex) {
        updatedQuestions[questionIndex].correctAnswer = (correctAnswerIndex - 1).toString()
      }
    } else if (updatedQuestions[questionIndex].type === "multiple_response") {
      const correctAnswers = updatedQuestions[questionIndex].correctAnswer as string[]
      const updatedCorrectAnswers = correctAnswers
        .filter((answer) => Number.parseInt(answer) !== optionIndex)
        .map((answer) => {
          const answerIndex = Number.parseInt(answer)
          return answerIndex > optionIndex ? (answerIndex - 1).toString() : answer
        })
      updatedQuestions[questionIndex].correctAnswer = updatedCorrectAnswers
    }

    setQuestions(updatedQuestions)
  }

  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast({
        title: "Cannot delete question",
        description: "A quiz must have at least one question.",
        variant: "destructive",
      })
      return
    }

    const updatedQuestions = [...questions]
    updatedQuestions.splice(index, 1)
    setQuestions(updatedQuestions)
  }

  const saveQuiz = () => {
    const quizData = {
      title: quizTitle,
      description: quizDescription,
      passingScore,
      randomize,
      maxAttempts,
      questions,
      createdAt: new Date().toISOString(),
    }

    setQuizData(quizData)

    toast({
      title: "Quiz saved",
      description: "Your quiz has been saved successfully.",
    })
  }

  const previewQuiz = () => {
    const quizData = {
      title: quizTitle,
      description: quizDescription,
      passingScore,
      randomize,
      maxAttempts,
      questions,
      createdAt: new Date().toISOString(),
    }

    setQuizData(quizData)
    navigate("/preview")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Quiz Builder</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveQuiz} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button onClick={previewQuiz} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quizTitle">Quiz Title</Label>
                <Input id="quizTitle" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quizDescription">Description</Label>
                <Textarea
                  id="quizDescription"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score: {passingScore}%</Label>
                <Slider
                  id="passingScore"
                  min={0}
                  max={100}
                  step={5}
                  value={[passingScore]}
                  onValueChange={(value) => setPassingScore(value[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                <Select
                  value={maxAttempts.toString()}
                  onValueChange={(value) => setMaxAttempts(Number.parseInt(value))}
                >
                  <SelectTrigger id="maxAttempts">
                    <SelectValue placeholder="Select max attempts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="0">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="randomize" checked={randomize} onCheckedChange={setRandomize} />
                <Label htmlFor="randomize">Randomize Questions</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                    <span className="truncate max-w-[200px]">{question.text}</span>
                    <Button variant="ghost" size="icon" onClick={() => deleteQuestion(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full flex items-center gap-2" onClick={addQuestion}>
                <PlusCircle className="h-4 w-4" />
                Add Question
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Question Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="0" className="w-full">
                <TabsList className="w-full overflow-x-auto">
                  {questions.map((question, index) => (
                    <TabsTrigger key={question.id} value={index.toString()}>
                      Question {index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {questions.map((question, index) => (
                  <TabsContent key={question.id} value={index.toString()} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`questionType-${index}`}>Question Type</Label>
                        <Select value={question.type} onValueChange={(value) => updateQuestionType(index, value)}>
                          <SelectTrigger id={`questionType-${index}`}>
                            <SelectValue placeholder="Select question type" />
                          </SelectTrigger>
                          <SelectContent>
                            {questionTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`questionPoints-${index}`}>Points: {question.points}</Label>
                        <Slider
                          id={`questionPoints-${index}`}
                          min={1}
                          max={20}
                          step={1}
                          value={[question.points]}
                          onValueChange={(value) => updatePoints(index, value[0])}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`questionText-${index}`}>Question Text</Label>
                      <Textarea
                        id={`questionText-${index}`}
                        value={question.text}
                        onChange={(e) => updateQuestionText(index, e.target.value)}
                        rows={2}
                      />
                    </div>

                    {(question.type === "multiple_choice" ||
                      question.type === "multiple_response" ||
                      question.type === "true_false") && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Options</Label>
                          {question.type !== "true_false" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(index)}
                              className="flex items-center gap-1"
                            >
                              <PlusCircle className="h-3 w-3" />
                              Add Option
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <div className="flex-1">
                                <Input
                                  value={option}
                                  onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                                  disabled={question.type === "true_false"}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                {question.type === "multiple_choice" && (
                                  <div className="flex items-center h-8">
                                    <input
                                      type="radio"
                                      name={`correct-${question.id}`}
                                      checked={question.correctAnswer === optionIndex.toString()}
                                      onChange={() => updateCorrectAnswer(index, optionIndex.toString())}
                                      className="mr-2"
                                    />
                                    <Label>Correct</Label>
                                  </div>
                                )}
                                {question.type === "multiple_response" && (
                                  <div className="flex items-center h-8">
                                    <input
                                      type="checkbox"
                                      checked={
                                        Array.isArray(question.correctAnswer) &&
                                        question.correctAnswer.includes(optionIndex.toString())
                                      }
                                      onChange={(e) => {
                                        const currentAnswers = Array.isArray(question.correctAnswer)
                                          ? [...question.correctAnswer]
                                          : []
                                        if (e.target.checked) {
                                          currentAnswers.push(optionIndex.toString())
                                        } else {
                                          const answerIndex = currentAnswers.indexOf(optionIndex.toString())
                                          if (answerIndex !== -1) {
                                            currentAnswers.splice(answerIndex, 1)
                                          }
                                        }
                                        updateCorrectAnswer(index, currentAnswers)
                                      }}
                                      className="mr-2"
                                    />
                                    <Label>Correct</Label>
                                  </div>
                                )}
                                {question.type === "true_false" && (
                                  <div className="flex items-center h-8">
                                    <input
                                      type="radio"
                                      name={`correct-${question.id}`}
                                      checked={question.correctAnswer === optionIndex.toString()}
                                      onChange={() => updateCorrectAnswer(index, optionIndex.toString())}
                                      className="mr-2"
                                    />
                                    <Label>Correct</Label>
                                  </div>
                                )}
                                {question.type !== "true_false" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(index, optionIndex)}
                                    disabled={question.options.length <= 2}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.type === "fill_in" && (
                      <div className="space-y-2">
                        <Label htmlFor={`correctAnswer-${index}`}>Correct Answer</Label>
                        <Input
                          id={`correctAnswer-${index}`}
                          value={question.correctAnswer as string}
                          onChange={(e) => updateCorrectAnswer(index, e.target.value)}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`correctFeedback-${index}`}>Correct Feedback</Label>
                        <Textarea
                          id={`correctFeedback-${index}`}
                          value={question.feedback.correct}
                          onChange={(e) => updateFeedback(index, "correct", e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`incorrectFeedback-${index}`}>Incorrect Feedback</Label>
                        <Textarea
                          id={`incorrectFeedback-${index}`}
                          value={question.feedback.incorrect}
                          onChange={(e) => updateFeedback(index, "incorrect", e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default QuizBuilder
