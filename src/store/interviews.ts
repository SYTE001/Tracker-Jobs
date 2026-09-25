import type { Interview } from "@/types"
import { uid } from "@/lib/utils"
import { nowIso } from "@/lib/dates"
import type { SetFn, GetFn, JobActions } from "./context"

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
      })
      return interview.id
    },

    updateInterview(id, patch) {
      set((s) => ({
        interviews: s.interviews.map((iv) => (iv.id === id ? { ...iv, ...patch } : iv)),
      }))
    },

    deleteInterview(id) {
      set((s) => ({ interviews: s.interviews.filter((iv) => iv.id !== id) }))
    },
  }
}
