import { z } from "zod"

/* ------------------------------------------------------------------ */
/* Domain enums (kept as const objects + zod enums for validation)     */
/* ------------------------------------------------------------------ */

export const STATUSES = ["wishlist", "applied", "interviewing", "offer", "rejected", "ghosted"] as const
export const JobStatus = z.enum(STATUSES)
export type JobStatus = z.infer<typeof JobStatus>

export const PRIORITIES = ["low", "medium", "high"] as const
export const Priority = z.enum(PRIORITIES)
export type Priority = z.infer<typeof Priority>

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const
export const WorkMode = z.enum(WORK_MODES)
export type WorkMode = z.infer<typeof WorkMode>

export const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "freelance"] as const
export const JobType = z.enum(JOB_TYPES)
export type JobType = z.infer<typeof JobType>

export const SOURCES = [
  "linkedin",
  "glints",
  "pintarnya",
  "instagram",
  "threads",
  "company",
  "referral",
  "email",
  "direct",
  "other",
] as const
export const Source = z.enum(SOURCES)
export type Source = z.infer<typeof Source>

export const REMINDER_TYPES = [
  "followup_recruiter",
  "followup_company",
  "check_application",
  "interview_prep",
  "custom",
] as const
export const ReminderType = z.enum(REMINDER_TYPES)
export type ReminderType = z.infer<typeof ReminderType>

export const INTERVIEW_TYPES = [
  "phone",
  "video",
  "onsite",
  "take_home",
  "technical",
  "behavioral",
  "panel",
  "other",
] as const
export const InterviewType = z.enum(INTERVIEW_TYPES)
export type InterviewType = z.infer<typeof InterviewType>

export const EVENT_TYPES = [
  "created",
  "status_changed",
  "note_added",
  "interview_scheduled",
  "interview_completed",
  "followup_scheduled",
  "followup_completed",
  "reminder_completed",
  "recruiter_contacted",
  "recruiter_replied",
  "offer_received",
  "rejection_received",
  "archived",
  "restored",
] as const
export const EventType = z.enum(EVENT_TYPES)
export type EventType = z.infer<typeof EventType>

export const CURRENCIES = ["IDR", "USD", "SGD", "MYR", "EUR", "GBP", "AUD", "JPY", "CNY"] as const
export const Currency = z.enum(CURRENCIES)
export type Currency = z.infer<typeof Currency>

/* ------------------------------------------------------------------ */
/* Model schemas                                                       */
/* ------------------------------------------------------------------ */

const id = z.string().min(1)
const optionalString = z.string().trim().optional()
const isoDate = z.string()

export const ApplicationSchema = z.object({
  id: id,
  company_id: z.string().min(1, "Company is required"),
  job_title: z.string().min(1, "Job title is required").max(200),
  status: JobStatus,
  source: Source.default("other"),
  job_url: optionalString,
  location: optionalString,
  work_mode: WorkMode.optional(),
  job_type: JobType.optional(),
  applied_date: optionalString,
  deadline: optionalString,
  salary_min: z.number().nullable().optional(),
  salary_max: z.number().nullable().optional(),
  currency: Currency.optional(),
  priority: Priority.default("medium"),
  recruiter_name: optionalString,
  recruiter_contact: optionalString,
  notes: optionalString,
  job_description: optionalString,
  requirements: optionalString,
  resume_used: optionalString,
  cover_letter_used: optionalString,
  tags: z.array(z.string().max(40)).default([]),
  archived: z.boolean().default(false),
  last_activity_at: optionalString,
  created_at: isoDate,
  updated_at: isoDate,
})
export type Application = z.infer<typeof ApplicationSchema>

export const CompanySchema = z.object({
  id: id,
  name: z.string().min(1, "Company name is required").max(150),
  logo: optionalString,
  website: optionalString,
  industry: optionalString,
  location: optionalString,
  notes: optionalString,
  created_at: isoDate,
})
export type Company = z.infer<typeof CompanySchema>

export const ApplicationEventSchema = z.object({
  id: id,
  application_id: id,
  event_type: EventType,
  event_date: isoDate,
  title: z.string().min(1),
  description: optionalString,
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: isoDate,
})
export type ApplicationEvent = z.infer<typeof ApplicationEventSchema>

export const ReminderSchema = z.object({
  id: id,
  application_id: id,
  reminder_type: ReminderType,
  reminder_date: isoDate, // yyyy-mm-dd
  completed: z.boolean().default(false),
  completed_at: optionalString,
  created_at: isoDate,
})
export type Reminder = z.infer<typeof ReminderSchema>

export const InterviewSchema = z.object({
  id: id,
  application_id: id,
  stage: optionalString,
  type: InterviewType.default("video"),
  date: isoDate, // yyyy-mm-dd
  start_time: optionalString,
  end_time: optionalString,
  interviewer: optionalString,
  meeting_url: optionalString,
  location: optionalString,
  notes: optionalString,
  result: optionalString,
  follow_up_date: optionalString,
  created_at: isoDate,
})
export type Interview = z.infer<typeof InterviewSchema>

export const SavedJobSchema = z.object({
  id: id,
  company_id: id,
  job_title: z.string().min(1, "Job title is required").max(200),
  source: Source.default("other"),
  url: optionalString,
  salary_min: z.number().nullable().optional(),
  salary_max: z.number().nullable().optional(),
  currency: Currency.optional(),
  deadline: optionalString,
  priority: Priority.default("medium"),
  notes: optionalString,
  status: z.enum(["saved", "applied", "archived"]).default("saved"),
  application_id: optionalString,
  created_at: isoDate,
  updated_at: isoDate,
})
export type SavedJob = z.infer<typeof SavedJobSchema>

/* Input shapes for store actions (company resolved by name, ids/timestamps generated) */
export type ApplicationInput = Omit<
  Partial<Application>,
  "id" | "company_id" | "created_at" | "updated_at" | "status" | "job_title"
> & {
  job_title: string
  companyName: string
  status?: JobStatus
}

export type ReminderInput = Pick<Reminder, "application_id" | "reminder_type" | "reminder_date">

export type InterviewInput = Omit<Partial<Interview>, "id" | "created_at"> & {
  application_id: string
  date: string
}

export type SavedJobInput = Omit<
  Partial<SavedJob>,
  "id" | "company_id" | "created_at" | "updated_at" | "job_title"
> & {
  job_title: string
  companyName: string
}

export const SettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  ghosted_threshold_days: z.number().int().min(1).max(365).default(21),
  auto_mark_ghosted: z.boolean().default(true),
  default_status: JobStatus.default("applied"),
  default_priority: Priority.default("medium"),
  default_view: z.enum(["board", "list", "overview"]).default("overview"),
  reduced_motion: z.boolean().default(false),
  currency: Currency.default("IDR"),
})
export type Settings = z.infer<typeof SettingsSchema>

/* ------------------------------------------------------------------ */
/* Database                                                            */
/* ------------------------------------------------------------------ */

export const STORAGE_VERSION = 3

export const JobTrackDbSchema = z.object({
  meta: z.object({ version: z.number() }),
  settings: SettingsSchema,
  applications: z.array(ApplicationSchema),
  companies: z.array(CompanySchema),
  application_events: z.array(ApplicationEventSchema),
  reminders: z.array(ReminderSchema),
  interviews: z.array(InterviewSchema),
  saved_jobs: z.array(SavedJobSchema),
})
export type JobTrackDb = z.infer<typeof JobTrackDbSchema>
