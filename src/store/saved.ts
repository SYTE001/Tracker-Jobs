import type { SavedJob } from "@/types"
import { uid } from "@/lib/utils"
import { nowIso } from "@/lib/dates"
import type { SetFn, GetFn, JobActions } from "./context"

export function savedJobActions(
  set: SetFn,
  get: GetFn,
): Pick<JobActions, "addSavedJob" | "updateSavedJob" | "deleteSavedJob" | "convertSavedJob"> {
  return {
    addSavedJob(input) {
      const companyId = get().upsertCompany(input.companyName)
      const now = nowIso()
      const job: SavedJob = {
        id: uid("sav"),
        company_id: companyId,
        job_title: input.job_title,
        source: input.source ?? "other",
        url: input.url,
        salary_min: input.salary_min ?? null,
        salary_max: input.salary_max ?? null,
        currency: input.currency ?? get().settings.currency,
        deadline: input.deadline,
        priority: input.priority ?? get().settings.default_priority,
        notes: input.notes,
        status: "saved",
        application_id: input.application_id,
        created_at: now,
        updated_at: now,
      }
      set((s) => ({ saved_jobs: [...s.saved_jobs, job] }))
      return job.id
    },

    updateSavedJob(id, patch) {
      set((s) => ({
        saved_jobs: s.saved_jobs.map((sj) =>
          sj.id === id ? { ...sj, ...patch, updated_at: nowIso() } : sj,
        ),
      }))
    },

    deleteSavedJob(id) {
      set((s) => ({ saved_jobs: s.saved_jobs.filter((sj) => sj.id !== id) }))
    },

    convertSavedJob(id) {
      const sj = get().saved_jobs.find((x) => x.id === id)
      if (!sj) return null
      const company = get().companies.find((c) => c.id === sj.company_id)
      const appId = get().addApplication({
        job_title: sj.job_title,
        companyName: company?.name ?? "",
        source: sj.source,
        job_url: sj.url,
        salary_min: sj.salary_min ?? undefined,
        salary_max: sj.salary_max ?? undefined,
        currency: sj.currency,
        deadline: sj.deadline,
        priority: sj.priority,
        notes: sj.notes,
        status: "applied",
      })
      set((s) => ({
        saved_jobs: s.saved_jobs.map((x) =>
          x.id === id
            ? { ...x, status: "applied", application_id: appId, updated_at: nowIso() }
            : x,
        ),
      }))
      return appId
    },
  }
}
