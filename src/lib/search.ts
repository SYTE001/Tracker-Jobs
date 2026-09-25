import type { Application, Company } from "@/types"

export interface SearchFilters {
  query?: string
  status?: string
  source?: string
  priority?: string
  work_mode?: string
  job_type?: string
  company_id?: string
  archived?: boolean | "all"
  tag?: string
}

const SQ = (v: unknown): string => String(v ?? "").toLowerCase().trim()

/** Filter + keyword-search applications against related companies. */
export function filterApplications(
  applications: Application[],
  companies: Company[],
  filters: SearchFilters,
): Application[] {
  const q = SQ(filters.query)
  const companyMap = new Map(companies.map((c) => [c.id, c.name]))

  return applications.filter((app) => {
    if (filters.archived === true && !app.archived) return false
    if (filters.archived === false && app.archived) return false
    if (filters.status && app.status !== filters.status) return false
    if (filters.source && app.source !== filters.source) return false
    if (filters.priority && app.priority !== filters.priority) return false
    if (filters.work_mode && app.work_mode !== filters.work_mode) return false
    if (filters.job_type && app.job_type !== filters.job_type) return false
    if (filters.company_id && app.company_id !== filters.company_id) return false
    if (filters.tag && !(app.tags ?? []).includes(filters.tag)) return false

    if (q) {
      const companyName = SQ(companyMap.get(app.company_id))
      const haystack = [
        app.job_title,
        companyName,
        app.notes,
        app.recruiter_name,
        app.source,
        app.location,
        ...(app.tags ?? []),
      ]
        .map(SQ)
        .join(" ")
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export type SortKey =
  | "updated"
  | "applied"
  | "title"
  | "company"
  | "priority"
  | "created"

export function sortApplications(
  applications: Application[],
  companies: Company[],
  key: SortKey,
  dir: "asc" | "desc" = "desc",
): Application[] {
  const companyMap = new Map(companies.map((c) => [c.id, c.name]))
  const mult = dir === "asc" ? 1 : -1
  const sorted = [...applications]
  sorted.sort((a, b) => {
    let cmp = 0
    switch (key) {
      case "updated":
        cmp = (a.updated_at ?? "").localeCompare(b.updated_at ?? "")
        break
      case "applied":
        cmp = (a.applied_date ?? "").localeCompare(b.applied_date ?? "")
        break
      case "created":
        cmp = (a.created_at ?? "").localeCompare(b.created_at ?? "")
        break
      case "title":
        cmp = a.job_title.localeCompare(b.job_title)
        break
      case "company":
        cmp = (companyMap.get(a.company_id) ?? "").localeCompare(companyMap.get(b.company_id) ?? "")
        break
      case "priority": {
        const order = { high: 2, medium: 1, low: 0 }
        cmp = (order[a.priority] ?? 0) - (order[b.priority] ?? 0)
        break
      }
    }
    return cmp * mult
  })
  return sorted
}
