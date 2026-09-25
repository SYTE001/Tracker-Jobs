import { useMemo } from "react"
import { useJobStore } from "./useJobStore"
import type { Application, Company, ApplicationEvent, Reminder, Interview } from "@/types"
import { daysSince, daysUntil, isDateToday, isDatePast } from "@/lib/dates"
import { classifyAttention, computeNextAction, ATTENTION_ORDER, type AttentionItem, type NextAction } from "@/lib/nextAction"

/**
 * NOTE: Zustand v5 uses Object.is on the selector result. Every hook below must
 * return a STABLE reference between renders, otherwise React re-renders forever.
 * Select a raw collection by reference, then memoize derived values with useMemo.
 */

/** Company id → Company lookup map (stable across renders until companies change). */
export function useCompanyMap(): Map<string, Company> {
  const companies = useJobStore((s) => s.companies)
  return useMemo(() => {
    const map = new Map<string, Company>()
    for (const c of companies) map.set(c.id, c)
    return map
  }, [companies])
}

export function useCompanyName(): (app: Application) => string {
  const map = useCompanyMap()
  return useMemo(() => (app: Application) => map.get(app.company_id)?.name ?? "Unknown company", [map])
}

/** Events for one application, newest first. */
export function useEventsFor(applicationId: string): ApplicationEvent[] {
  const events = useJobStore((s) => s.application_events)
  return useMemo(
    () => events.filter((e) => e.application_id === applicationId).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [events, applicationId],
  )
}

export function useRemindersFor(applicationId: string): Reminder[] {
  const reminders = useJobStore((s) => s.reminders)
  return useMemo(() => reminders.filter((r) => r.application_id === applicationId), [reminders, applicationId])
}

export function useInterviewsFor(applicationId: string): Interview[] {
  const interviews = useJobStore((s) => s.interviews)
  return useMemo(() => interviews.filter((iv) => iv.application_id === applicationId), [interviews, applicationId])
}

/** All active (non-completed) reminders, flagged overdue, soonest first. */
export function useActiveReminders() {
  const reminders = useJobStore((s) => s.reminders)
  return useMemo(
    () =>
      reminders
        .filter((r) => !r.completed)
        .map((reminder) => ({ reminder, overdue: isDatePast(reminder.reminder_date) }))
        .sort((a, b) => (a.reminder.reminder_date < b.reminder.reminder_date ? -1 : 1)),
    [reminders],
  )
}

/** Today + overdue active reminder counts and upcoming interview count (for badges). */
export function useDueCounts() {
  const reminders = useJobStore((s) => s.reminders)
  const interviews = useJobStore((s) => s.interviews)
  return useMemo(() => {
    const active = reminders.filter((r) => !r.completed)
    return {
      overdue: active.filter((r) => isDatePast(r.reminder_date)).length,
      today: active.filter((r) => isDateToday(r.reminder_date)).length,
      upcoming: interviews.filter((iv) => (daysUntil(iv.date) ?? -1) >= 0).length,
    }
  }, [reminders, interviews])
}

export interface DerivedApplication {
  daysSinceApplied: number | null
  daysSinceUpdate: number | null
  active: boolean
  overdueFollowup: boolean
  hasUpcomingInterview: boolean
  nextFollowupDate: string | null
}

/** Derived, non-persisted values for an application. */
export function deriveApplication(app: Application, reminders: Reminder[], interviews: Interview[]): DerivedApplication {
  const open = reminders.filter((r) => !r.completed).sort((a, b) => (a.reminder_date < b.reminder_date ? -1 : 1))
  const soonest = open[0]
  return {
    daysSinceApplied: daysSince(app.applied_date),
    daysSinceUpdate: daysSince(app.updated_at),
    active: app.status === "applied" || app.status === "interviewing" || app.status === "offer",
    overdueFollowup: soonest ? isDatePast(soonest.reminder_date) : false,
    hasUpcomingInterview: interviews.some((iv) => (daysUntil(iv.date) ?? -1) >= 0),
    nextFollowupDate: soonest?.reminder_date ?? null,
  }
}

/* ------------------------------------------------------------------ */
/* Grouping maps + next-action / attention selectors                  */
/* ------------------------------------------------------------------ */

/** application_id → reminders (stable until reminders change). */
export function useRemindersByApp(): Map<string, Reminder[]> {
  const reminders = useJobStore((s) => s.reminders)
  return useMemo(() => {
    const map = new Map<string, Reminder[]>()
    for (const r of reminders) {
      const list = map.get(r.application_id)
      if (list) list.push(r)
      else map.set(r.application_id, [r])
    }
    return map
  }, [reminders])
}

/** application_id → interviews (stable until interviews change). */
export function useInterviewsByApp(): Map<string, Interview[]> {
  const interviews = useJobStore((s) => s.interviews)
  return useMemo(() => {
    const map = new Map<string, Interview[]>()
    for (const iv of interviews) {
      const list = map.get(iv.application_id)
      if (list) list.push(iv)
      else map.set(iv.application_id, [iv])
    }
    return map
  }, [interviews])
}

/** Returns a memoized `(app) => NextAction` resolver. */
export function useNextActionResolver(): (app: Application) => NextAction {
  const remindersByApp = useRemindersByApp()
  const interviewsByApp = useInterviewsByApp()
  const threshold = useJobStore((s) => s.settings.ghosted_threshold_days)
  return useMemo(
    () => (app: Application) =>
      computeNextAction(app, remindersByApp.get(app.id) ?? [], interviewsByApp.get(app.id) ?? [], {
        ghosted_threshold_days: threshold,
      }),
    [remindersByApp, interviewsByApp, threshold],
  )
}

/** Attention queue across all active applications, ordered by urgency. */
export function useAttentionQueue(limit?: number): AttentionItem[] {
  const applications = useJobStore((s) => s.applications)
  const remindersByApp = useRemindersByApp()
  const interviewsByApp = useInterviewsByApp()
  const threshold = useJobStore((s) => s.settings.ghosted_threshold_days)
  return useMemo(() => {
    const items: AttentionItem[] = []
    for (const app of applications) {
      const item = classifyAttention(app, remindersByApp.get(app.id) ?? [], interviewsByApp.get(app.id) ?? [], {
        ghosted_threshold_days: threshold,
      })
      if (item) items.push(item)
    }
    items.sort((a, b) => {
      const w = ATTENTION_ORDER[a.kind] - ATTENTION_ORDER[b.kind]
      if (w !== 0) return w
      // Within a bucket, earliest driving date first; null dates last.
      if (a.date && b.date) return a.date < b.date ? -1 : 1
      if (a.date) return -1
      if (b.date) return 1
      return 0
    })
    return typeof limit === "number" ? items.slice(0, limit) : items
  }, [applications, remindersByApp, interviewsByApp, threshold, limit])
}
