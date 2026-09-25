import type { Reminder } from "@/types"
import { uid } from "@/lib/utils"
import { nowIso } from "@/lib/dates"
import type { SetFn, GetFn, JobActions } from "./context"

export function reminderActions(
  set: SetFn,
  get: GetFn,
): Pick<JobActions, "addReminder" | "completeReminder" | "updateReminder" | "deleteReminder"> {
  return {
    addReminder(input) {
      const now = nowIso()
      const reminder: Reminder = {
        id: uid("rem"),
        application_id: input.application_id,
        reminder_type: input.reminder_type,
        reminder_date: input.reminder_date,
        completed: false,
        created_at: now,
      }
      set((s) => ({ reminders: [...s.reminders, reminder] }))
      get().addEvent(
        input.application_id,
        "followup_scheduled",
        "Follow-up scheduled",
        input.reminder_date,
        { reminder_type: input.reminder_type },
      )
      return reminder.id
    },

    completeReminder(id) {
      const r = get().reminders.find((x) => x.id === id)
      if (!r || r.completed) return
      const now = nowIso()
      set((s) => ({
        reminders: s.reminders.map((x) =>
          x.id === id ? { ...x, completed: true, completed_at: now } : x,
        ),
      }))
      get().addEvent(r.application_id, "reminder_completed", "Follow-up completed")
    },

    updateReminder(id, patch) {
      set((s) => ({
        reminders: s.reminders.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      }))
    },

    deleteReminder(id) {
      set((s) => ({ reminders: s.reminders.filter((x) => x.id !== id) }))
    },
  }
}
