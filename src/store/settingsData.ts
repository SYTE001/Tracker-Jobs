import {
  ApplicationSchema,
  CompanySchema,
  ApplicationEventSchema,
  ReminderSchema,
  InterviewSchema,
  SavedJobSchema,
  SettingsSchema,
  type JobStatus,
  type JobTrackDb,
} from "@/types"
import { nowIso } from "@/lib/dates"
import { uid } from "@/lib/utils"
import { buildSampleData } from "@/lib/sample"
import type { SetFn, GetFn, JobActions, ImportResult } from "./context"

export function settingsDataActions(
  set: SetFn,
  get: GetFn,
): Pick<JobActions, "setSettings" | "ghostSweep" | "seedSampleData" | "importData" | "resetData"> {
  return {
    setSettings(patch) {
      set((s) => ({ settings: { ...s.settings, ...patch } }))
    },

    ghostSweep() {
      const { applications, settings } = get()
      if (!settings.auto_mark_ghosted) return
      const thresholdMs = settings.ghosted_threshold_days * 24 * 60 * 60 * 1000
      const now = Date.now()
      const toGhost: string[] = []
      for (const app of applications) {
        if (app.archived) continue
        if (app.status !== "applied" && app.status !== "interviewing") continue
        const ref = app.last_activity_at || app.applied_date || app.updated_at || app.created_at
        const refTime = new Date(ref).getTime()
        if (isNaN(refTime)) continue
        if (now - refTime >= thresholdMs) toGhost.push(app.id)
      }
      if (toGhost.length === 0) return
      const stamped = nowIso()
      set((s) => ({
        applications: s.applications.map((a) =>
          toGhost.includes(a.id)
            ? { ...a, status: "ghosted" as JobStatus, last_activity_at: stamped, updated_at: stamped }
            : a,
        ),
      }))
      for (const id of toGhost) {
        get().addEvent(
          id,
          "status_changed",
          "Auto-marked as ghosted",
          `No activity for ${get().settings.ghosted_threshold_days}+ days`,
          { from: "applied|interviewing", to: "ghosted", auto: true },
        )
      }
    },

    importData(payload, mode): ImportResult {
      const errors: string[] = []
      const safeArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

      if (payload == null || typeof payload !== "object") {
        return {
          ok: false,
          mode,
          counts: { applications: 0, companies: 0, events: 0 },
          errors: ["The file does not contain a valid Tracker-Jobs backup."],
          message: "Couldn't import this file.",
        }
      }
      const p = payload as Record<string, unknown>
      const rawApps = safeArray(p.applications)
      const rawCompanies = safeArray(p.companies)
      const rawEvents = safeArray(p.events ?? p.application_events)
      const rawReminders = safeArray(p.reminders)
      const rawInterviews = safeArray(p.interviews)
      const rawSaved = safeArray(p.savedJobs ?? p.saved_jobs)

      const companies: JobTrackDb["companies"] = []
      const applications: JobTrackDb["applications"] = []
      const application_events: JobTrackDb["application_events"] = []
      const reminders: JobTrackDb["reminders"] = []
      const interviews: JobTrackDb["interviews"] = []
      const saved_jobs: JobTrackDb["saved_jobs"] = []

      for (const row of rawCompanies) {
        const r = CompanySchema.safeParse(row)
        if (r.success) companies.push(r.data)
        else errors.push(`Company row invalid: ${r.error.issues.map((i) => i.message).join(", ")}`)
      }
      for (const row of rawApps) {
        const r = ApplicationSchema.safeParse(row)
        if (r.success) applications.push(r.data)
        else errors.push(`Application “${(row as { job_title?: string })?.job_title ?? "?"}” invalid: ${r.error.issues[0]?.message}`)
      }
      for (const row of rawEvents) {
        const r = ApplicationEventSchema.safeParse(row)
        if (r.success && applications.some((a) => a.id === (row as { application_id?: string }).application_id))
          application_events.push(r.data)
      }
      for (const row of rawReminders) {
        const r = ReminderSchema.safeParse(row)
        if (r.success) reminders.push(r.data)
      }
      for (const row of rawInterviews) {
        const r = InterviewSchema.safeParse(row)
        if (r.success) interviews.push(r.data)
      }
      for (const row of rawSaved) {
        const r = SavedJobSchema.safeParse(row)
        if (r.success) saved_jobs.push(r.data)
      }

      const settings = p.settings ? SettingsSchema.safeParse(p.settings) : null

      set((s) => {
        const clear = mode === "replace"
        return {
          settings: settings?.success ? { ...s.settings, ...settings.data } : s.settings,
          companies: mergeById(clear ? [] : s.companies, companies),
          applications: mergeById(clear ? [] : s.applications, applications),
          application_events: mergeById(clear ? [] : s.application_events, application_events),
          reminders: mergeById(clear ? [] : s.reminders, reminders),
          interviews: mergeById(clear ? [] : s.interviews, interviews),
          saved_jobs: mergeById(clear ? [] : s.saved_jobs, saved_jobs),
        }
      })

      const counts = {
        applications: applications.length,
        companies: companies.length,
        events: application_events.length,
      }
      const message =
        errors.length > 0
          ? `Imported ${applications.length} applications. ${errors.length} record${errors.length === 1 ? "" : "s"} skipped.`
          : `Imported ${applications.length} applications successfully. ${
              mode === "replace" ? "Existing data replaced." : "Merged with existing data."
            }`
      return { ok: true, mode, counts, errors, message }
    },

    resetData() {
      set((s) => ({
        ...emptyCollections(),
        settings: s.settings,
      }))
    },

    seedSampleData() {
      const { buildSampleData } = sampleLib
      const { applications, companies, application_events, reminders, interviews } = buildSampleData()
      set((s) => ({
        companies: mergeById(s.companies, companies),
        applications: mergeById(s.applications, applications),
        application_events: mergeById(s.application_events, application_events),
        reminders: mergeById(s.reminders, reminders),
        interviews: mergeById(s.interviews, interviews),
      }))
    },
  }
}

const sampleLib = { buildSampleData }


function emptyCollections(): Pick<
  JobTrackDb,
  "applications" | "companies" | "application_events" | "reminders" | "interviews" | "saved_jobs"
> {
  return {
    applications: [],
    companies: [],
    application_events: [],
    reminders: [],
    interviews: [],
    saved_jobs: [],
  }
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  if (incoming.length === 0) return existing
  const map = new Map<string, T>()
  for (const item of existing) map.set(item.id, item)
  for (const item of incoming) map.set(item.id, item)
  return Array.from(map.values())
}

/** Re-export uid to keep import/export key generation consistent. */
export { uid }
