import type { Application, Company, SavedJob, Interview, Reminder } from "@/types"
import { SOURCE_LABELS, REMINDER_LABELS, INTERVIEW_TYPE_LABELS } from "@/lib/constants"

export type SearchEntity = "application" | "company" | "saved" | "interview" | "followup"

export interface SearchResult {
  id: string
  entity: SearchEntity
  title: string
  subtitle: string
  /** Route to navigate to on select. */
  to: string
}

const SQ = (v: unknown) => String(v ?? "").toLowerCase()

interface Db {
  applications: Application[]
  companies: Company[]
  saved_jobs: SavedJob[]
  interviews: Interview[]
  reminders: Reminder[]
}

/**
 * Global search across every entity (PRD §15). Returns grouped, capped
 * results; an empty query returns the most recently touched applications.
 */
export function globalSearch(db: Db, rawQuery: string, perGroup = 5): Record<SearchEntity, SearchResult[]> {
  const q = SQ(rawQuery).trim()
  const companyName = new Map(db.companies.map((c) => [c.id, c.name]))

  const empty: Record<SearchEntity, SearchResult[]> = {
    application: [],
    company: [],
    saved: [],
    interview: [],
    followup: [],
  }

  if (!q) {
    empty.application = [...db.applications]
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
      .slice(0, perGroup)
      .map((a) => appResult(a, companyName.get(a.company_id)))
    return empty
  }

  const match = (haystack: unknown[]) => haystack.map(SQ).join(" ").includes(q)

  empty.application = db.applications
    .filter((a) =>
      match([a.job_title, companyName.get(a.company_id), a.notes, a.recruiter_name, a.source, a.location, ...(a.tags ?? [])]),
    )
    .slice(0, perGroup)
    .map((a) => appResult(a, companyName.get(a.company_id)))

  empty.company = db.companies
    .filter((c) => match([c.name, c.industry, c.location, c.notes]))
    .slice(0, perGroup)
    .map((c) => ({
      id: c.id,
      entity: "company" as const,
      title: c.name,
      subtitle: [c.industry, c.location].filter(Boolean).join(" · ") || "Company",
      to: `/companies/${c.id}`,
    }))

  empty.saved = db.saved_jobs
    .filter((s) => match([s.job_title, companyName.get(s.company_id), s.notes, s.source]))
    .slice(0, perGroup)
    .map((s) => ({
      id: s.id,
      entity: "saved" as const,
      title: s.job_title,
      subtitle: [companyName.get(s.company_id), s.source ? SOURCE_LABELS[s.source] : null].filter(Boolean).join(" · ") || "Saved job",
      to: `/saved`,
    }))

  empty.interview = db.interviews
    .filter((iv) => {
      const app = db.applications.find((a) => a.id === iv.application_id)
      return match([iv.stage, iv.interviewer, iv.type, app?.job_title, companyName.get(app?.company_id ?? "")])
    })
    .slice(0, perGroup)
    .map((iv) => {
      const app = db.applications.find((a) => a.id === iv.application_id)
      return {
        id: iv.id,
        entity: "interview" as const,
        title: [iv.stage || INTERVIEW_TYPE_LABELS[iv.type], app?.job_title].filter(Boolean).join(" — "),
        subtitle: companyName.get(app?.company_id ?? "") ?? "Interview",
        to: app ? `/applications/${app.id}` : "/interviews",
      }
    })

  empty.followup = db.reminders
    .filter((r) => {
      const app = db.applications.find((a) => a.id === r.application_id)
      return match([REMINDER_LABELS[r.reminder_type], app?.job_title, companyName.get(app?.company_id ?? "")])
    })
    .slice(0, perGroup)
    .map((r) => {
      const app = db.applications.find((a) => a.id === r.application_id)
      return {
        id: r.id,
        entity: "followup" as const,
        title: [REMINDER_LABELS[r.reminder_type], app?.job_title].filter(Boolean).join(" — "),
        subtitle: companyName.get(app?.company_id ?? "") ?? "Follow-up",
        to: app ? `/applications/${app.id}` : "/followups",
      }
    })

  return empty
}

function appResult(a: Application, company?: string): SearchResult {
  return {
    id: a.id,
    entity: "application",
    title: a.job_title,
    subtitle: company ?? "Unknown company",
    to: `/applications/${a.id}`,
  }
}

export const ENTITY_LABEL: Record<SearchEntity, string> = {
  application: "Applications",
  company: "Companies",
  saved: "Saved jobs",
  interview: "Interviews",
  followup: "Follow-ups",
}
