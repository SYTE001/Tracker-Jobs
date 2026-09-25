import { useRef, useState } from "react"
import { Download, Upload, RotateCcw, HardDrive, FileJson, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { downloadBackup, downloadCsv, previewImport } from "@/lib/export"
import { readBackupFile } from "@/lib/import"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared"
import { ConfirmDialog } from "@/components/shared"
import type { ImportResult } from "@/store/context"

export function DataPage() {
  const db = useJobStore()
  const importData = useJobStore((s) => s.importData)
  const resetData = useJobStore((s) => s.resetData)
  const fileRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<ReturnType<typeof previewImport> | null>(null)
  const [raw, setRaw] = useState<unknown>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  const total = db.applications.length

  const onFile = async (f: File) => {
    try {
      const data = await readBackupFile(f)
      setRaw(data)
      setPreview(previewImport(data))
      setResult(null)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const doImport = (mode: "merge" | "replace") => {
    const res = importData(raw, mode)
    setResult(res)
    setPreview(null)
    setRaw(null)
    if (fileRef.current) fileRef.current.value = ""
    if (res.ok) toast.success(res.message)
    else toast.error(res.message)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Data & Backup" description="Export, import, and manage your local data." />

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Local storage</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Your data is stored in this browser — nothing is sent to a server. {total} active application
          {total === 1 ? "" : "s"} across {db.companies.length} companies.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Export</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { downloadBackup(db) ; toast.success("Backup downloaded") }}>
            <FileJson className="h-4 w-4" /> Full backup (JSON)
          </Button>
          <Button variant="outline" onClick={() => { downloadCsv(db); toast.success("CSV downloaded") }}>
            <FileSpreadsheet className="h-4 w-4" /> Applications CSV
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Import</h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Import a backup file. Invalid records are skipped, never crash the app.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        {preview && (
          <div className="mt-4 rounded-md border border-border bg-muted/40 p-4">
            <p className="mb-2 text-sm font-medium">Found in this backup:</p>
            <ul className="mb-3 space-y-1 text-sm text-muted-foreground">
              <li>{preview.applications} applications</li>
              <li>{preview.companies} companies</li>
              <li>{preview.events} events</li>
              <li>{preview.reminders} reminders · {preview.interviews} interviews · {preview.savedJobs} saved jobs</li>
            </ul>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => doImport("merge")}>Merge</Button>
              <Button size="sm" variant="destructive" onClick={() => doImport("replace")}>Replace all</Button>
              <Button size="sm" variant="ghost" onClick={() => { setPreview(null); setRaw(null) }}>Cancel</Button>
            </div>
          </div>
        )}
        {result && (
          <div className={`mt-4 rounded-md border p-4 text-sm ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"}`}>
            <p className="font-medium">{result.message}</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
                {result.errors.slice(0, 6).map((e, i) => <li key={i}>{e}</li>)}
                {result.errors.length > 6 && <li>… and {result.errors.length - 6} more</li>}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-destructive/40 bg-card p-5">
        <div className="mb-2 flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold">Danger zone</h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Wipe all applications, companies, events, reminders, interviews and saved jobs. Your settings are kept.
        </p>
        <Button variant="destructive" onClick={() => setResetOpen(true)}>Reset all data</Button>
      </section>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all data?"
        description="This permanently deletes every application and all related records. It can’t be undone. Export a backup first if you need one."
        confirmLabel="Reset everything"
        destructive
        onConfirm={() => { resetData(); toast.success("All data reset") }}
      />
    </div>
  )
}
