import type { Application, ApplicationEvent } from "@/types"
import { uid } from "@/lib/utils"
import { nowIso } from "@/lib/dates"
import type { SetFn, GetFn, JobActions } from "./context"

export function applicationActions(
  set: SetFn,
  get: GetFn,
): Pick<
  JobActions,
  "addApplication" | "updateApplication" | "setStatus" | "archiveApplication" | "deleteApplication" | "addEvent"
> {
  function pushEvent(event: ApplicationEvent) {
    set((s) => ({ application_events: [...s.application_events, event] }))
  }

  return {
    addApplication(input) {
      const companyId = get().upsertCompany(input.companyName)
      const status = input.status ?? get().settings.default_status
      const priority = input.priority ?? get().settings.default_priority
      const now = nowIso()
      const app: Application = {
        id: uid("app"),
        company_id: companyId,
        job_title: input.job_title,
        status,
        source: input.source ?? "other",
        priority,
        job_url: input.job_url ?? "",
        location: input.location,
        work_mode: input.work_mode,
        job_type: input.job_type,
        applied_date: input.applied_date ?? (status === "wishlist" ? undefined : today()),
        deadline: input.deadline,
        salary_min: input.salary_min ?? null,
        salary_max: input.salary_max ?? null,
        currency: input.currency ?? get().settings.currency,
        recruiter_name: input.recruiter_name,
        recruiter_contact: input.recruiter_contact,
        notes: input.notes,
        job_description: input.job_description,
        requirements: input.requirements,
        resume_used: input.resume_used,
        cover_letter_used: input.cover_letter_used,
        tags: input.tags ?? [],
        archived: false,
        last_activity_at: now,
        created_at: now,
        updated_at: now,
      }
      set((s) => ({ applications: [...s.applications, app] }))
      pushEvent({
        id: uid("evt"),
        application_id: app.id,
        event_type: "created",
        event_date: now,
        title: `Added “${app.job_title}”`,
        created_at: now,
      })
      return app.id
    },

    updateApplication(id, patch) {
      const current = get().applications.find((a) => a.id === id)
      const isNoteEdit =
        typeof patch.notes === "string" && patch.notes.trim() !== "" && patch.notes !== current?.notes
      const now = nowIso()
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === id
            ? { ...a, ...patch, ...(isNoteEdit ? { last_activity_at: now } : {}), updated_at: now }
            : a,
        ),
      }))
      if (isNoteEdit) {
        get().addEvent(id, "note_added", "Notes updated")
      }
    },

    setStatus(id, status) {
      const app = get().applications.find((a) => a.id === id)
      if (!app || app.status === status) return
      const now = nowIso()
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === id
            ? { ...a, status, last_activity_at: now, updated_at: now }
            : a,
        ),
      }))
      get().addEvent(id, "status_changed", `Status changed to ${status}`, undefined, {
        from: app.status,
        to: status,
      })
    },

    archiveApplication(id, archived) {
      const now = nowIso()
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === id ? { ...a, archived, updated_at: now } : a,
        ),
      }))
      get().addEvent(id, archived ? "archived" : "restored", archived ? "Application archived" : "Application restored")
    },

    deleteApplication(id) {
      set((s) => ({
        applications: s.applications.filter((a) => a.id !== id),
        application_events: s.application_events.filter((e) => e.application_id !== id),
        reminders: s.reminders.filter((r) => r.application_id !== id),
        interviews: s.interviews.filter((iv) => iv.application_id !== id),
        saved_jobs: s.saved_jobs.map((sj) =>
          sj.application_id === id ? { ...sj, application_id: undefined } : sj,
        ),
      }))
    },

    addEvent(applicationId, eventType, title, description, metadata) {
      const now = nowIso()
      pushEvent({
        id: uid("evt"),
        application_id: applicationId,
        event_type: eventType,
        event_date: now,
        title,
        description,
        metadata,
        created_at: now,
      })
    },
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
