import type { Interview } from "@/types"
import { uid } from "@/lib/utils"
import { nowIso } from "@/lib/dates"
import type { SetFn, GetFn, JobActions } from "./context"

/** Bump meaningful-activity timestamp (drives ghosted logic, not cosmetic edits). */
function touchActivity(set: SetFn, appId: string) {
  const now = nowIso()
  set((s) => ({
    applications: s.applications.map((a) =>
      a.id === appId ? { ...a, last_activity_at: now, updated_at: now } : a,
    ),
  }))
}

export function interviewActions(
  set: SetFn,
  get: GetFn,
): Pick<JobActions, "addInterview" | "updateInterview" | "deleteInterview"> {
  return {
    addInterview(input) {
      const now = nowIso()
      const interview: Interview = {
        id: uid("iv"),
        application_id: input.application_id,
        stage: input.stage,
        type: input.type ?? "video",
        date: input.date,
        start_time: input.start_time,
        end_time: input.end_time,
        interviewer: input.interviewer,
        meeting_url: input.meeting_url,
        location: input.location,
        notes: input.notes,
        result: input.result,
        follow_up_date: input.follow_up_date,
        created_at: now,
      }
      set((s) => ({ interviews: [...s.interviews, interview] }))
      get().addEvent(input.application_id, "interview_scheduled", "Interview scheduled", input.date, {
        interview_type: interview.type,
        stage: interview.stage,
      })
      touchActivity(set, input.application_id)
      return interview.id
    },

    updateInterview(id, patch) {
      const prev = get().interviews.find((iv) => iv.id === id)
      set((s) => ({
        interviews: s.interviews.map((iv) => (iv.id === id ? { ...iv, ...patch } : iv)),
      }))
      // Recording a result for the first time marks the interview complete in history.
      if (prev && !prev.result && typeof patch.result === "string" && patch.result.trim() !== "") {
        get().addEvent(prev.application_id, "interview_completed", "Interview completed", patch.result)
        touchActivity(set, prev.application_id)
      }
    },

    deleteInterview(id) {
      set((s) => ({ interviews: s.interviews.filter((iv) => iv.id !== id) }))
    },
  }
}
