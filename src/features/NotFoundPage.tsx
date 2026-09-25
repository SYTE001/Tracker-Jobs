import { Link } from "react-router-dom"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Compass className="mb-4 h-10 w-10 text-muted-foreground" />
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">This route doesn't exist.</p>
      <Link to="/overview" className="mt-4"><Button>Back to overview</Button></Link>
    </div>
  )
}
