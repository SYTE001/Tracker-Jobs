import type {
  JobTrackDb,
  Application,
  ApplicationInput,
  Company,
  JobStatus,
  Reminder,
  ReminderInput,
  Interview,
  InterviewInput,
  SavedJob,
  SavedJobInput,
  Settings,
  EventType,
} from "@/types"

export type AppStore = JobTrackDb & JobActions

export type SetFn = (
  partial: Partial<AppStore> | ((s: AppStore) => Partial<AppStore>),
) => void
export type GetFn = () => AppStore

export interface JobActions {
  /* companies */
  upsertCompany: (name: string, patch?: Partial<Company>) => string
  updateCompany: (id: string, patch: Partial<Company>) => void
  deleteCompany: (id: string) => boolean

  /* applications */
  addApplication: (input: ApplicationInput) => string
  updateApplication: (id: string, patch: Partial<Application>) => void
  setStatus: (id: string, status: JobStatus) => void
  archiveApplication: (id: string, archived: boolean) => void
  deleteApplication: (id: string) => void

  /* events */
  addEvent: (
    applicationId: string,
    eventType: EventType,
    title: string,
    description?: string,
    metadata?: Record<string, unknown>,
  ) => void

  /* reminders */
  addReminder: (input: ReminderInput) => string
  completeReminder: (id: string) => void
  updateReminder: (id: string, patch: Partial<Reminder>) => void
  deleteReminder: (id: string) => void

  /* interviews */
  addInterview: (input: InterviewInput) => string
  updateInterview: (id: string, patch: Partial<Interview>) => void
  deleteInterview: (id: string) => void

  /* saved jobs */
  addSavedJob: (input: SavedJobInput) => string
  updateSavedJob: (id: string, patch: Partial<SavedJob>) => void
  deleteSavedJob: (id: string) => void
  convertSavedJob: (id: string) => string | null

  /* settings + data */
  setSettings: (patch: Partial<Settings>) => void
  ghostSweep: () => void
  seedSampleData: () => void
  importData: (payload: unknown, mode: "merge" | "replace") => ImportResult
  resetData: () => void
}

export interface ImportResult {
  ok: boolean
  mode: "merge" | "replace"
  counts: { applications: number; companies: number; events: number }
  errors: string[]
  message: string
}
