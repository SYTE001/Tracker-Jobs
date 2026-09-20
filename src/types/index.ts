import { z } from 'zod'

export const JobStatus = z.enum([
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'ghosted',
  'wishlist'
])
export type JobStatus = z.infer<typeof JobStatus>

export const ApplicationEventSchema = z.object({
  id: z.string(),
  application_id: z.string(),
  event_type: z.string(),
  event_date: z.string(),
  title: z.string(),
  description: z.string().optional()
})
export type ApplicationEvent = z.infer<typeof ApplicationEventSchema>

export const ApplicationSchema = z.object({
  id: z.string(),
  job_title: z.string().min(1, 'Job title is required'),
  company_id: z.string().min(1, 'Company is required'),
  location: z.string().optional(),
  work_mode: z.string().optional(),
  job_type: z.string().optional(),
  status: JobStatus,
  source: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  salary_min: z.number().nullable().optional(),
  salary_max: z.number().nullable().optional(),
  currency: z.string().optional(),
  applied_date: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  tags: z.array(z.string()).optional() // New smart feature
})
export type Application = z.infer<typeof ApplicationSchema>

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Company name is required'),
  website: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string()
})
export type Company = z.infer<typeof CompanySchema>

export const JobTrackDbSchema = z.object({
  meta: z.object({
    version: z.number(),
    theme: z.string()
  }),
  applications: z.array(ApplicationSchema),
  companies: z.array(CompanySchema),
  application_events: z.array(ApplicationEventSchema),
  reminders: z.array(z.any()).optional(),
  saved_jobs: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional()
})
export type JobTrackDb = z.infer<typeof JobTrackDbSchema>
