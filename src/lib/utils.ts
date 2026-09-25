import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Collision-resistant id generator (crypto fallback included). */
export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}_${rand}`
}

/** Normalize a company name for duplicate detection. */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\b(inc|llc|corp|corporation|ltd|limited|co|company|pt|cv|tbk|gmbh|sarl|plc)\b/g, "")
    .trim()
    .replace(/\s+/g, " ")
}

/** Return the initials of a company/job name, max 2 chars. */
export function initials(name?: string): string {
  if (!name) return "??"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return `${n} ${n === 1 ? singular : plural ?? singular + "s"}`
}

/** Format a long string with a cap for metatadata/value cells. */
export function truncate(str?: string, max = 60): string {
  if (!str) return ""
  return str.length > max ? str.slice(0, max - 1) + "…" : str
}
