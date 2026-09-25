import { useMemo, useRef, useState } from "react"
import {
  Download,
  Upload,
  RotateCcw,
  HardDrive,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  LifeBuoy,
} from "lucide-react"
import { toast } from "sonner"
import { useJobStore, getRecoveryInfo, clearRecovery } from "@/store/useJobStore"
import { downloadBackup, downloadCsv, previewImport } from "@/lib/export"
import { readBackupFile } from "@/lib/import"
import { Button } from "@/components/ui/button"
import { PageHeader, Section, ConfirmDialog } from "@/components/shared"
import { relativeTime } from "@/lib/dates"
import type { ImportResult } from "@/store/context"

const STORAGE_KEY = "jobtrack-local-db-v1"

function formatBytes(n: number): string {
  if (n <= 0) return "0 KB"
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function DataPage() {
  const db = useJobStore()
  const importData = useJobStore((s) => s.importData)
  const resetData = useJobStore((s) => s.resetData)
  const fileRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<ReturnType<typeof previewImport> | null>(null)
  const [raw, setRaw] = useState<unknown>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [recovery, setRecovery] = useState(() => getRecoveryInfo())

  const total = db.applications.length

  // Approximate local storage footprint + most recent change timestamp.
  const storage = useMemo(() => {
    let bytes = 0
    let lastChange: string | null = null
    try {
      bytes = (localStorage.getItem(STORAGE_KEY) ?? "").length
    } catch {
      /* storage unavailable */
    }
    const stamps = [
      ...db.applications.map((a) => a.updated_at),
      ...db.saved_jobs.map((s) => s.updated_at),
      ...db.companies.map((c) => c.created_at),
    ].filter(Boolean) as string[]
    if (stamps.length) lastChange = stamps.reduce((max, t) => (t > max ? t : max))
    return { bytes, lastChange }
  }, [db.applications, db.saved_jobs, db.companies])

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

  const downloadRecovered = () => {
    if (!recovery.raw) return
    const blob = new Blob([recovery.raw], { type: "application/json" })
    triggerDownload(blob, `jobtrack-recovered-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success("Recovered data downloaded")
  }

  const dismissRecovery = () => {
    clearRecovery()
    setRecovery({ corrupt: false, raw: null })
    toast.success("Recovery dismissed — starting fresh")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <PageHeader title="Data & Backup" description="Export, import, and manage your local data." />

      {/* ---- Recovery panel (§17.1) --------------------------------- */}
      {recovery.corrupt && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/5 p-5 shadow-overlay"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <LifeBuoy className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">We couldn&apos;t read your saved data</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Your previously stored data was corrupt and could not be loaded, so the app started with a clean
                slate. Your original data was <span className="font-medium text-foreground">not deleted</span> — the
                raw copy is preserved below. Download it, restore a backup, or start fresh.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={downloadRecovered} disabled={!recovery.raw}>
                  <Download className="h-3.5 w-3.5" />
                  Download recovered data
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  Import a backup
                </Button>
                <Button size="sm" variant="ghost" onClick={dismissRecovery}>
                  Dismiss & start fresh
                </Button>
              </div>
              {!recovery.raw && (
                <p className="mt-2 text-xs text-muted-foreground">
                  The raw copy could not be preserved on this device, so there is nothing to download.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Storage info ------------------------------------------- */}
      <Section title="Local storage">
        <div className="flex items-start gap-3">
          <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Your data is stored only in this browser — nothing is sent to a server.
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Applications</dt>
                <dd className="font-medium tnum">
                  {total} across {db.companies.length} companies
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Approx. size</dt>
                <dd className="font-medium tnum">{formatBytes(storage.bytes)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last change</dt>
                <dd className="font-medium">{storage.lastChange ? relativeTime(storage.lastChange) : "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>

      {/* ---- Export ------------------------------------------------- */}
      <Section title="Export" description="Download a full backup or a spreadsheet of your applications.">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              downloadBackup(db)
              toast.success("Backup downloaded")
            }}
          >
            <FileJson className="h-4 w-4" /> Full backup (JSON)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              downloadCsv(db)
              toast.success("CSV downloaded")
            }}
          >
            <FileSpreadsheet className="h-4 w-4" /> Applications CSV
          </Button>
        </div>
      </Section>

      {/* ---- Import ------------------------------------------------- */}
      <Section
        title="Import"
        description="Restore from a backup. Invalid records are skipped — the app never crashes, and nothing is overwritten without your choice."
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-accent"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        {preview && (
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-sm font-medium">Found in this backup</p>
            <ul className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] text-muted-foreground sm:grid-cols-3">
              <li className="tnum">{preview.applications} applications</li>
              <li className="tnum">{preview.companies} companies</li>
              <li className="tnum">{preview.events} events</li>
              <li className="tnum">{preview.reminders} reminders</li>
              <li className="tnum">{preview.interviews} interviews</li>
              <li className="tnum">{preview.savedJobs} saved jobs</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => doImport("merge")}>
                Merge into current data
              </Button>
              <Button size="sm" variant="destructive" onClick={() => doImport("replace")}>
                Replace all
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPreview(null)
                  setRaw(null)
                  if (fileRef.current) fileRef.current.value = ""
                }}
              >
                Cancel
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Merge keeps your current data and adds new records. Replace clears everything first.
            </p>
          </div>
        )}
        {result && (
          <div
            className={
              result.ok
                ? "mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm"
                : "mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
            }
          >
            <p className="font-medium">{result.message}</p>
            <p className="mt-1 text-[13px] text-muted-foreground tnum">
              {result.counts.applications} applications · {result.counts.companies} companies · {result.counts.events} events
              {" "}({result.mode})
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                {result.errors.slice(0, 6).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 6 && <li>… and {result.errors.length - 6} more</li>}
              </ul>
            )}
          </div>
        )}
      </Section>

      {/* ---- Danger zone -------------------------------------------- */}
      <Section title="Danger zone">
        <div className="rounded-lg border border-destructive/40 bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold">Reset all data</h3>
          </div>
          <p className="mb-3 text-[13px] text-muted-foreground">
            Permanently wipe all applications, companies, events, reminders, interviews, and saved jobs. Your
            settings are kept. Export a backup first if you might need it.
          </p>
          <Button variant="destructive" onClick={() => setResetOpen(true)}>
            <RotateCcw className="h-4 w-4" />
            Reset all data
          </Button>
        </div>
      </Section>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all data?"
        description="This permanently deletes every application and all related records. It can't be undone. Export a backup first if you need one."
        confirmLabel="Reset everything"
        destructive
        onConfirm={() => {
          resetData()
          toast.success("All data reset")
        }}
      />
    </div>
  )
}
