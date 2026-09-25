import type { Company } from "@/types"
import { normalizeCompanyName, uid } from "@/lib/utils"
import { nowIso } from "@/lib/dates"
import type { SetFn, GetFn, JobActions } from "./context"

export function companyActions(set: SetFn, get: GetFn): Pick<JobActions, "upsertCompany" | "updateCompany" | "deleteCompany"> {
  return {
    upsertCompany(name, patch) {
      const trimmed = name.trim()
      const key = normalizeCompanyName(trimmed)
      const existing = get().companies.find((c) => normalizeCompanyName(c.name) === key)
      if (existing && key) {
        return existing.id
      }
      const company: Company = {
        id: uid("cmp"),
        name: trimmed,
        created_at: nowIso(),
        ...patch,
      }
      set((s) => ({ companies: [...s.companies, company] }))
      return company.id
    },

    updateCompany(id, patch) {
      set((s) => ({
        companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }))
    },

    deleteCompany(id) {
      const dependent = get().applications.filter((a) => a.company_id === id).length
      if (dependent > 0) return false // refuse: applications reference this company
      const dependentSaved = get().saved_jobs.filter((sj) => sj.company_id === id).length
      if (dependentSaved > 0) return false
      set((s) => ({ companies: s.companies.filter((c) => c.id !== id) }))
      return true
    },
  }
}
