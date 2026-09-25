import type { Application, Interview, Reminder, Settings } from "@/types"
import { daysUntil, daysSince } from "@/lib/dates"

export type NextActionKind =
  | "apply"
  | "follow_up"
  | "prepare_interview"
  | "attend_interview"
  | "respond_recruiter"
  | "check_application"
  | "review_offer"
  | "none"

export type Urgency = "overdue" | "today" | "soon" | "normal" | "none"

export interface NextAction {
  kind: NextActionKind
  label: string
  urgency: Urgency
  /** yyyy-mm-dd of the driving date, when applicable. */
  date: string | null
}

const LABELS: Record<NextActionKind, string> = {
  apply: "Apply",
  follow_up: "Follow up",
  prepare_interview: "Prepare interview",
  attend_interview: "Attend interview",
  respond_recruiter: "Respond to recruiter",
  check_application: "Check application",
  review_offer: "Review offer",
  none: "No action needed",
}

function label(kind: NextActionKind): string {
  return LABELS[kind]
}

/** Is the application in an actively-managed state? */
export function isActive(app: Application): boolean {
  return !app.archived && (app.status === "applied" || app.status === "interviewing" || app.status === "offer")
}

/**
 * Derive the single most important next action for an application.
 * Priority mirrors PRD §23: overdue → interview soon → deadline soon →
 * follow-up today → needs action → normal.
 */
export function computeNextAction(
  app: Application,
  reminders: Reminder[],
  interviews: Interview[],
  settings?: Pick<Settings, "ghosted_threshold_days">,
): NextAction {
  if (app.archived || app.status === "rejected" || app.status === "ghosted") {
    return { kind: "none", label: label("none"), urgency: "none", date: null }
  }

  const openReminders = reminders
    .filter((r) => !r.completed)
    .sort((a, b) => (a.reminder_date < b.reminder_date ? -1 : 1))
  const upcomingInterviews = interviews
    .filter((iv) => (daysUntil(iv.date) ?? -1) >= 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  // 1. Overdue follow-up.
  const overdue = openReminders.find((r) => (daysUntil(r.reminder_date) ?? 0) < 0)
  if (overdue) {
    const kind = overdue.reminder_type === "interview_prep" ? "prepare_interview" : "follow_up"
    return { kind, label: label(kind), urgency: "overdue", date: overdue.reminder_date }
  }

  // 2. Interview within 48h.
  const soonInterview = upcomingInterviews.find((iv) => (daysUntil(iv.date) ?? 99) <= 2)
  if (soonInterview) {
    return { kind: "attend_interview", label: label("attend_interview"), urgency: "soon", date: soonInterview.date }
  }

  // 3. Deadline within 3 days for an un-submitted opportunity.
  if ((app.status === "wishlist" || app.status === "applied") && app.deadline) {
    const d = daysUntil(app.deadline)
    if (d !== null && d >= 0 && d <= 3) {
      const kind = app.status === "wishlist" ? "apply" : "follow_up"
      return { kind, label: label(kind), urgency: "soon", date: app.deadline }
    }
  }

  // 4. Follow-up due today.
  const todayReminder = openReminders.find((r) => (daysUntil(r.reminder_date) ?? 1) === 0)
  if (todayReminder) {
    const kind = todayReminder.reminder_type === "interview_prep" ? "prepare_interview" : "follow_up"
    return { kind, label: label(kind), urgency: "today", date: todayReminder.reminder_date }
  }

  // 5. Upcoming (but not soon) interview → prepare.
  if (app.status === "interviewing" && upcomingInterviews.length > 0) {
    return { kind: "prepare_interview", label: label("prepare_interview"), urgency: "normal", date: upcomingInterviews[0].date }
  }

  // 6. Any scheduled follow-up in the future.
  if (openReminders.length > 0) {
    const kind = openReminders[0].reminder_type === "interview_prep" ? "prepare_interview" : "follow_up"
    return { kind, label: label(kind), urgency: "normal", date: openReminders[0].reminder_date }
  }

  // 7. Status-derived default when nothing is scheduled.
  if (app.status === "wishlist") return { kind: "apply", label: label("apply"), urgency: "normal", date: null }
  if (app.status === "offer") return { kind: "review_offer", label: label("review_offer"), urgency: "normal", date: null }
  if (app.status === "interviewing")
    return { kind: "check_application", label: label("check_application"), urgency: "normal", date: null }

  // Applied with no scheduled action — nudge based on inactivity.
  if (app.status === "applied") {
    const threshold = settings?.ghosted_threshold_days ?? 21
    const inactive = daysSince(app.last_activity_at || app.applied_date || app.updated_at)
    if (inactive !== null && inactive >= Math.ceil(threshold / 2)) {
      return { kind: "follow_up", label: label("follow_up"), urgency: "normal", date: null }
    }
    return { kind: "check_application", label: label("check_application"), urgency: "normal", date: null }
  }

  return { kind: "none", label: label("none"), urgency: "none", date: null }
}

export type AttentionKind =
  | "overdue_followup"
  | "interview_soon"
  | "deadline_soon"
  | "followup_today"
  | "needs_action"
  | "recently_changed"

/** Numeric weight for sorting the attention queue (lower = more urgent). */
export const ATTENTION_ORDER: Record<AttentionKind, number> = {
  overdue_followup: 0,
  interview_soon: 1,
  deadline_soon: 2,
  followup_today: 3,
  needs_action: 4,
  recently_changed: 5,
}

export interface AttentionItem {
  application: Application
  kind: AttentionKind
  next: NextAction
  /** Driving date for display/sorting. */
  date: string | null
}

/**
 * Classify an active application into the highest-priority attention bucket,
 * or null when it needs no attention right now.
 */
export function classifyAttention(
  app: Application,
  reminders: Reminder[],
  interviews: Interview[],
  settings?: Pick<Settings, "ghosted_threshold_days">,
): AttentionItem | null {
  if (!isActive(app)) return null
  const next = computeNextAction(app, reminders, interviews, settings)

  if (next.urgency === "overdue") return { application: app, kind: "overdue_followup", next, date: next.date }

  const upcoming = interviews
    .filter((iv) => (daysUntil(iv.date) ?? -1) >= 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  const soonInterview = upcoming.find((iv) => (daysUntil(iv.date) ?? 99) <= 2)
  if (soonInterview) return { application: app, kind: "interview_soon", next, date: soonInterview.date }

  if ((app.status === "wishlist" || app.status === "applied") && app.deadline) {
    const d = daysUntil(app.deadline)
    if (d !== null && d >= 0 && d <= 3) return { application: app, kind: "deadline_soon", next, date: app.deadline }
  }

  if (next.urgency === "today") return { application: app, kind: "followup_today", next, date: next.date }

  const hasScheduled = reminders.some((r) => !r.completed) || upcoming.length > 0
  if (!hasScheduled) return { application: app, kind: "needs_action", next, date: null }

  return null
}
