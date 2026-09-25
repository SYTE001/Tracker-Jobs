import { format, formatDistanceToNow, isAfter, isBefore, isToday, parseISO, differenceInCalendarDays } from "date-fns"

/** Today as yyyy-mm-dd (local) — the canonical date-string format for the app. */
export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd")
}

/** RFC3339 timestamp for created_at/updated_at. */
export function nowIso(): string {
  return new Date().toISOString()
}

/** Format an ISO date string (yyyy-mm-dd) into a friendly label. */
export function formatDate(input?: string | null, pattern = "MMM d, yyyy"): string {
  if (!input) return "—"
  const d = parseISO(input)
  if (isNaN(d.getTime())) return input
  return format(d, pattern)
}

export function formatDateTime(input?: string | null): string {
  if (!input) return "—"
  const d = parseISO(input)
  if (isNaN(d.getTime())) return input
  return format(d, "MMM d, yyyy • h:mm a")
}

export function relativeTime(input?: string | null): string {
  if (!input) return "—"
  const d = parseISO(input)
  if (isNaN(d.getTime())) return input
  return formatDistanceToNow(d, { addSuffix: true })
}

/** True when the given yyyy-mm-dd string is today. */
export function isDateToday(input?: string | null): boolean {
  if (!input) return false
  const d = parseISO(input)
  return !isNaN(d.getTime()) && isToday(d)
}

/** True when the date is in the past (before today). */
export function isDatePast(input?: string | null): boolean {
  if (!input) return false
  const d = parseISO(input)
  return !isNaN(d.getTime()) && isBefore(d, new Date()) && !isToday(d)
}

/** True when the date is today or in the future. */
export function isDateUpcoming(input?: string | null): boolean {
  if (!input) return false
  const d = parseISO(input)
  return !isNaN(d.getTime()) && (isToday(d) || isAfter(d, new Date()))
}

/** Whole days between today and a date string (negative = past). */
export function daysUntil(input?: string | null): number | null {
  if (!input) return null
  const d = parseISO(input)
  if (isNaN(d.getTime())) return null
  return differenceInCalendarDays(d, new Date())
}

/** Days since an ISO/RFC timestring or yyyy-mm-dd. */
export function daysSince(input?: string | null): number | null {
  if (!input) return null
  const d = parseISO(input)
  if (isNaN(d.getTime())) return null
  return differenceInCalendarDays(new Date(), d)
}

/** Format a number of days as a compact human label. */
export function dayLabel(days: number | null | undefined): string {
  if (days == null) return "—"
  if (days === 0) return "today"
  if (days === 1) return "tomorrow"
  if (days === -1) return "yesterday"
  if (days > 1) return `in ${days} days`
  return `${Math.abs(days)} days ago`
}
