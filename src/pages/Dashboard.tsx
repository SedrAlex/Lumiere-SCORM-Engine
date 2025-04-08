import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { BookOpen, FileText, Package, ArrowRight } from "lucide-react"

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Lumiére SCORM Engine</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Build, preview, and package SCORM-compliant e-learning content with the Lumiére SCORM Engine
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Course Builder</CardTitle>
            <CardDescription>Create interactive courses with multiple pages and content</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Design your course structure, add content pages, and organize your learning materials.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/course-builder" className="flex items-center justify-center gap-2">
                Start Building <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Quiz Builder</CardTitle>
            <CardDescription>Create assessments with various question types</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Build quizzes with multiple choice, true/false, and other question types. Set passing scores and feedback.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/quiz-builder" className="flex items-center justify-center gap-2">
                Create Quiz <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <Package className="h-8 w-8 text-primary mb-2" />
            <CardTitle>SCORM Packager</CardTitle>
            <CardDescription>Export your content as SCORM packages</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Package your courses and quizzes as SCORM 1.2 or 2004 compliant packages for use in any LMS.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/package" className="flex items-center justify-center gap-2">
                Package Content <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 border rounded-lg p-6 bg-muted/50">
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>
            Create a course structure using the <strong>Course Builder</strong>
          </li>
          <li>
            Add assessments with the <strong>Quiz Builder</strong>
          </li>
          <li>Preview your content to ensure it works as expected</li>
          <li>Package your content as a SCORM zip file</li>
          <li>Upload the package to your Learning Management System</li>
        </ol>
      </div>
    </div>
  )
}

export default Dashboard
