"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { PlusCircle, Trash2, MoveVertical, Save, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CourseBuilderProps {
  setCourseData: (data: any) => void
}

const CourseBuilder = ({ setCourseData }: CourseBuilderProps) => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [courseTitle, setCourseTitle] = useState("My SCORM Course")
  const [courseDescription, setCourseDescription] = useState("A course created with Lumiére SCORM Engine")
  const [pages, setPages] = useState([
    {
      id: "page-1",
      title: "Introduction",
      content: "<h1>Welcome to the Course</h1><p>This is the introduction page of your course.</p>",
    },
  ])

  const addPage = () => {
    const newPageId = `page-${pages.length + 1}`
    setPages([
      ...pages,
      {
        id: newPageId,
        title: `Page ${pages.length + 1}`,
        content: `<h1>Page ${pages.length + 1}</h1><p>Content for page ${pages.length + 1}</p>`,
      },
    ])
  }

  const updatePageTitle = (index: number, title: string) => {
    const updatedPages = [...pages]
    updatedPages[index].title = title
    setPages(updatedPages)
  }

  const updatePageContent = (index: number, content: string) => {
    const updatedPages = [...pages]
    updatedPages[index].content = content
    setPages(updatedPages)
  }

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      toast({
        title: "Cannot delete page",
        description: "A course must have at least one page.",
        variant: "destructive",
      })
      return
    }

    const updatedPages = [...pages]
    updatedPages.splice(index, 1)
    setPages(updatedPages)
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(pages)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setPages(items)
  }

  const saveCourse = () => {
    const courseData = {
      title: courseTitle,
      description: courseDescription,
      pages: pages,
      createdAt: new Date().toISOString(),
    }

    setCourseData(courseData)

    toast({
      title: "Course saved",
      description: "Your course has been saved successfully.",
    })
  }

  const previewCourse = () => {
    const courseData = {
      title: courseTitle,
      description: courseDescription,
      pages: pages,
      createdAt: new Date().toISOString(),
    }

    setCourseData(courseData)
    navigate("/preview")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Course Builder</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveCourse} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button onClick={previewCourse} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseTitle">Course Title</Label>
                <Input id="courseTitle" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseDescription">Description</Label>
                <Textarea
                  id="courseDescription"
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="pages">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {pages.map((page, index) => (
                        <Draggable key={page.id} draggableId={page.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center justify-between p-3 border rounded-md bg-card"
                            >
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="cursor-move">
                                  <MoveVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span>{page.title}</span>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => deletePage(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full flex items-center gap-2" onClick={addPage}>
                <PlusCircle className="h-4 w-4" />
                Add Page
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Page Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="0" className="w-full">
                <TabsList className="w-full overflow-x-auto">
                  {pages.map((page, index) => (
                    <TabsTrigger key={page.id} value={index.toString()}>
                      {page.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {pages.map((page, index) => (
                  <TabsContent key={page.id} value={index.toString()} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`pageTitle-${index}`}>Page Title</Label>
                      <Input
                        id={`pageTitle-${index}`}
                        value={page.title}
                        onChange={(e) => updatePageTitle(index, e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`pageContent-${index}`}>Content (HTML)</Label>
                      <Textarea
                        id={`pageContent-${index}`}
                        value={page.content}
                        onChange={(e) => updatePageContent(index, e.target.value)}
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="border rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">Preview:</h3>
                      <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                      />
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

export default CourseBuilder
