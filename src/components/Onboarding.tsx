import { useEffect, useState } from "react"
import { Briefcase, Database, Rocket } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

const KEY = "jobtrack-onboarded"

export function Onboarding() {
  const seeded = useJobStore((s) => s.seedSampleData)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(KEY) === "1"
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 250)
      return () => clearTimeout(t)
    }
  }, [])

  const done = () => {
    localStorage.setItem(KEY, "1")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md" hideClose>
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg">Welcome to JobTrack</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Track every application, interview, and follow-up in one place. Your data is stored locally in
            this browser — nothing is sent anywhere.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          <Button
            className="h-auto w-full justify-start gap-3 px-4 py-3"
            variant="default"
            onClick={() => {
              seeded()
              done()
            }}
          >
            <Database className="h-4 w-4 shrink-0" />
            <span className="text-left">
              <span className="block font-medium">Load sample jobs</span>
              <span className="block text-xs font-normal opacity-80">
                Explore with realistic example data across every stage.
              </span>
            </span>
          </Button>
          <Button variant="outline" className="h-auto w-full justify-start gap-3 px-4 py-3" onClick={done}>
            <Rocket className="h-4 w-4 shrink-0" />
            <span className="text-left">
              <span className="block font-medium">Start empty</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Begin tracking your own job search now.
              </span>
            </span>
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          You can add or remove data anytime in Settings → Data &amp; Backup.
        </p>
      </DialogContent>
    </Dialog>
  )
}
