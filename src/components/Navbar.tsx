import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { ModeToggle } from "./mode-toggle"
import { BookOpen, FileText, Package, Home } from "lucide-react"

const Navbar = () => {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Lumiére SCORM Builder</span>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/course-builder" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Builder
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/quiz-builder" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quiz Builder
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/package" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Package
            </Link>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <ModeToggle />
        </div>
      </div>
    </nav>
  )
}

export default Navbar
