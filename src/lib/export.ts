import type { JobTrackDb, Application } from "@/types"
import { STORAGE_VERSION } from "@/types"
import { SOURCE_LABELS, STATUS_META, WORK_MODE_LABELS, PRIORITY_META, JOB_TYPE_LABELS } from "./constants"

export interface Backup {
  schemaVersion: number
  exportedAt: string
  settings: JobTrackDb["settings"]
  applications: JobTrackDb["applications"]
  companies: JobTrackDb["companies"]
  events: JobTrackDb["application_events"]
  reminders: JobTrackDb["reminders"]
  interviews: JobTrackDb["interviews"]
  savedJobs: JobTrackDb["saved_jobs"]
}

export function buildBackup(db: JobTrackDb): Backup {
  return {
    schemaVersion: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    settings: db.settings,
    applications: db.applications,
    companies: db.companies,
    events: db.application_events,
    reminders: db.reminders,
    interviews: db.interviews,
    savedJobs: db.saved_jobs,
  }
}

export function downloadBackup(db: JobTrackDb) {
  const backup = buildBackup(db)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
  triggerDownload(blob, `jobtrack-backup-${new Date().toISOString().slice(0, 10)}.json`)
}

/* ------------------------------------------------------------------ */
/* CSV export for applications                                         */
/* ------------------------------------------------------------------ */
function csvEscape(value: unknown): string {
  const str = value == null ? "" : String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function applicationsToCsv(db: JobTrackDb): string {
  const companyMap = new Map(db.companies.map((c) => [c.id, c.name]))
  const header = [
    "Job title",
    "Company",
    "Status",
    "Source",
    "Location",
    "Work mode",
    "Job type",
    "Applied date",
    "Deadline",
    "Priority",
    "Salary min",
    "Salary max",
    "Currency",
    "Recruiter",
    "Tags",
    "Job URL",
    "Notes",
    "Created",
    "Updated",
  ]
  const rows = db.applications.map((a) => [
    a.job_title,
    companyMap.get(a.company_id) ?? "",
    STATUS_META[a.status].label,
    a.source ? SOURCE_LABELS[a.source] : "",
    a.location ?? "",
    a.work_mode ? WORK_MODE_LABELS[a.work_mode] : "",
    a.job_type ? JOB_TYPE_LABELS[a.job_type] : "",
    a.applied_date ?? "",
    a.deadline ?? "",
    a.priority ? PRIORITY_META[a.priority].label : "",
    a.salary_min ?? "",
    a.salary_max ?? "",
    a.currency ?? "",
    a.recruiter_name ?? "",
    (a.tags ?? []).join("; "),
    a.job_url ?? "",
    (a.notes ?? "").replace(/\n/g, " "),
    a.created_at,
    a.updated_at,
  ])
  const lines = [header, ...rows].map((row) => row.map(csvEscape).join(","))
  return lines.join("\n")
}

export function downloadCsv(db: JobTrackDb) {
  const blob = new Blob([applicationsToCsv(db)], { type: "text/csv;charset=utf-8;" })
  triggerDownload(blob, `jobtrack-applications-${new Date().toISOString().slice(0, 10)}.csv`)
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

/** Preview counts from a raw backup payload (used by the import dialog). */
export function previewImport(payload: unknown): {
  applications: number
  companies: number
  events: number
  reminders: number
  interviews: number
  savedJobs: number
} {
  const p = payload as Record<string, unknown> | null
  const len = (v: unknown) => (Array.isArray(v) ? v.length : 0)
  return {
    applications: len(p?.applications),
    companies: len(p?.companies),
    events: len(p?.events ?? p?.application_events),
    reminders: len(p?.reminders),
    interviews: len(p?.interviews),
    savedJobs: len(p?.savedJobs ?? p?.saved_jobs),
  }
}

export type { Application }
