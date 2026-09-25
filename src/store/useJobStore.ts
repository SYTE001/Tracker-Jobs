import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { StateStorage } from "zustand/middleware"
import {
  STORAGE_VERSION,
  ApplicationSchema,
  CompanySchema,
  ApplicationEventSchema,
  ReminderSchema,
  InterviewSchema,
  SavedJobSchema,
  SettingsSchema,
  type JobTrackDb,
  type Settings,
} from "@/types"
import { uid } from "@/lib/utils"
import { nowIso } from "@/lib/dates"
import { companyActions } from "./companies"
import { applicationActions } from "./applications"
import { reminderActions } from "./reminders"
import { interviewActions } from "./interviews"
import { savedJobActions } from "./saved"
import { settingsDataActions } from "./settingsData"
import type { AppStore, SetFn, GetFn } from "./context"

const STORAGE_KEY = "jobtrack-local-db-v1"

const defaultSettings: Settings = {
  theme: "system",
  ghosted_threshold_days: 21,
  auto_mark_ghosted: true,
  default_status: "applied",
  default_priority: "medium",
  default_view: "overview",
  reduced_motion: false,
  currency: "IDR",
}

const defaultState: JobTrackDb = {
  meta: { version: STORAGE_VERSION },
  settings: defaultSettings,
  applications: [],
  companies: [],
  application_events: [],
  reminders: [],
  interviews: [],
  saved_jobs: [],
}

/* ------------------------------------------------------------------ */
/* Storage adapter — tolerates raw legacy shape and corrupt data       */
/* ------------------------------------------------------------------ */
const dbStorage: StateStorage = {
  getItem(name) {
    const value = localStorage.getItem(name)
    if (!value) return null
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === "object" && "state" in parsed) {
        return JSON.stringify(parsed) // already Zustand persist format
      }
      return JSON.stringify({ state: parsed, version: 0 }) // wrap raw legacy db
    } catch {
      return null // corrupt storage → start fresh, never brick
    }
  },
  setItem(name, value) {
    try {
      localStorage.setItem(name, value)
    } catch {
      /* storage full/unavailable — app keeps working in memory */
    }
  },
  removeItem(name) {
    try {
      localStorage.removeItem(name)
    } catch {
      /* noop */
    }
  },
}

/* ------------------------------------------------------------------ */
/* Migration (any older persisted shape → v3)                          */
/* ------------------------------------------------------------------ */
function arr(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : []
}

function normalizeSettings(settings: unknown, legacyTheme?: unknown): Settings {
  const candidate =
    typeof settings === "object" && settings !== null
      ? (settings as Record<string, unknown>)
      : {}
  let theme = candidate.theme as Settings["theme"]
  if (theme !== "light" && theme !== "dark" && theme !== "system") {
    theme = legacyTheme === "dark" ? "dark" : "system"
  }
  const parsed = SettingsSchema.safeParse({ ...defaultSettings, ...candidate, theme })
  return parsed.success ? parsed.data : defaultSettings
}

function normalizeApplication(raw: Record<string, unknown>) {
  const repaired: Record<string, unknown> = {
    ...raw,
    job_url: raw.job_url ?? raw.url ?? "",
    source: raw.source ?? "other",
    priority: raw.priority ?? "medium",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    archived: raw.archived ?? false,
    salary_min: raw.salary_min ?? null,
    salary_max: raw.salary_max ?? null,
    currency: raw.currency ?? defaultSettings.currency,
    createdAt: undefined,
    company: undefined,
  }
  delete repaired.createdAt
  delete repaired.company
  if (!repaired.created_at) repaired.created_at = nowIso()
  if (!repaired.updated_at) repaired.updated_at = nowIso()
  if (!repaired.id) repaired.id = uid("app")
  if (!repaired.company_id) repaired.company_id = uid("cmp")
  const r = ApplicationSchema.safeParse(repaired)
  return r.success ? r.data : null
}

function normalizeCompany(raw: Record<string, unknown>) {
  const repaired = { ...raw }
  if (!repaired.id) repaired.id = uid("cmp")
  if (!repaired.created_at) repaired.created_at = nowIso()
  const r = CompanySchema.safeParse(repaired)
  return r.success ? r.data : null
}

function normalizeEvent(raw: Record<string, unknown>) {
  const repaired = { ...raw }
  if (!repaired.id) repaired.id = uid("evt")
  if (!repaired.created_at) repaired.created_at = nowIso()
  if (!repaired.event_date) repaired.event_date = nowIso()
  const r = ApplicationEventSchema.safeParse(repaired)
  return r.success ? r.data : null
}

function normalizeReminder(raw: Record<string, unknown>) {
  const repaired = { ...raw }
  if (!repaired.id) repaired.id = uid("rem")
  if (!repaired.created_at) repaired.created_at = nowIso()
  const r = ReminderSchema.safeParse(repaired)
  return r.success ? r.data : null
}

function normalizeInterview(raw: Record<string, unknown>) {
  const repaired = { ...raw }
  if (!repaired.id) repaired.id = uid("iv")
  if (!repaired.created_at) repaired.created_at = nowIso()
  const r = InterviewSchema.safeParse(repaired)
  return r.success ? r.data : null
}

function normalizeSaved(raw: Record<string, unknown>) {
  const repaired = { ...raw }
  if (!repaired.id) repaired.id = uid("sav")
  if (!repaired.created_at) repaired.created_at = nowIso()
  if (!repaired.updated_at) repaired.updated_at = nowIso()
  const r = SavedJobSchema.safeParse(repaired)
  return r.success ? r.data : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(persisted: any, _version: number): JobTrackDb {
  const s: Record<string, unknown> =
    persisted && typeof persisted === "object" ? persisted : {}
  const legacyMeta = s.meta as { theme?: unknown } | undefined
  return {
    meta: { version: STORAGE_VERSION },
    settings: normalizeSettings(s.settings, legacyMeta?.theme),
    companies: arr(s.companies).map(normalizeCompany).filter(Boolean) as JobTrackDb["companies"],
    applications: arr(s.applications).map(normalizeApplication).filter(Boolean) as JobTrackDb["applications"],
    application_events: arr(s.application_events).map(normalizeEvent).filter(Boolean) as JobTrackDb["application_events"],
    reminders: arr(s.reminders).map(normalizeReminder).filter(Boolean) as JobTrackDb["reminders"],
    interviews: arr(s.interviews).map(normalizeInterview).filter(Boolean) as JobTrackDb["interviews"],
    saved_jobs: arr(s.saved_jobs).map(normalizeSaved).filter(Boolean) as JobTrackDb["saved_jobs"],
  }
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */
function compose(set: SetFn, get: GetFn) {
  return {
    ...companyActions(set, get),
    ...applicationActions(set, get),
    ...reminderActions(set, get),
    ...interviewActions(set, get),
    ...savedJobActions(set, get),
    ...settingsDataActions(set, get),
  }
}

export const useJobStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...defaultState,
      ...compose(set as SetFn, get as GetFn),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => dbStorage),
      migrate,
    },
  ),
)
