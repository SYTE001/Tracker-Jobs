import { useMemo } from "react"
import { useJobStore } from "@/store/useJobStore"
import type { Application, JobStatus } from "@/types"
import { STATUS_ORDER } from "@/lib/constants"
import { format, parseISO, differenceInCalendarDays } from "date-fns"

const ACTIVE: JobStatus[] = ["applied", "interviewing", "offer"]

export function useJobCounts() {
  const applications = useJobStore((s) => s.applications)
  const interviews = useJobStore((s) => s.interviews)
  return useMemo(() => {
    const live = applications.filter((a) => !a.archived)
    const byStatus = (s: JobStatus) => live.filter((a) => a.status === s).length
    return {
      total: live.length,
      active: live.filter((a) => ACTIVE.includes(a.status)).length,
      applied: byStatus("applied"),
      interviewing: byStatus("interviewing"),
      interviews: interviews.length,
      offers: byStatus("offer"),
      rejected: byStatus("rejected"),
      ghosted: byStatus("ghosted"),
      wishlist: byStatus("wishlist"),
      archived: applications.filter((a) => a.archived).length,
    }
  }, [applications, interviews])
}

/** Interval counts of applications created (or applied) per week, last N weeks. */
export function applicationsPerWeek(applications: Application[], weeks = 8) {
  const now = new Date()
  const buckets: { week: string; label: string; count: number }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const start = new Date(d)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const count = applications.filter((a) => {
      const ts = a.applied_date ?? a.created_at
      if (!ts) return false
      const t = parseISO(ts)
      return t >= start && t < end
    }).length
    buckets.push({ week: start.toISOString(), label: format(start, "MMM d"), count })
  }
  return buckets
}

export interface FunnelMeter {
  total: number
  interviewed: number
  offer: number
  rejected: number
  interviewRate: number | null
  offerRate: number | null
  rejectionRate: number | null
  responseRate: number | null
  avgResponseDays: number | null
}

/** Compute conversion metrics (null when denominator is zero). */
export function computeMetrics(applications: Application[], events: JobEventLike[]): FunnelMeter {
  const live = applications.filter((a) => !a.archived)
  const total = live.length
  const interviewed = live.filter((a) => a.status === "interviewing" || a.status === "offer").length
  const offer = live.filter((a) => a.status === "offer").length
  const rejected = live.filter((a) => a.status === "rejected").length

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : null)

  // Avg time to first response: days from applied_date to first status_changed event (to non-applied)
  const respDurations: number[] = []
  for (const app of live) {
    if (!app.applied_date) continue
    const evts = events
      .filter((e) => e.application_id === app.id && e.event_type === "status_changed")
      .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))
    const first = evts.find((e) => e.metadata?.from !== "wishlist")
    if (!first || !first.created_at) continue
    const d = differenceInCalendarDays(parseISO(first.created_at), parseISO(app.applied_date))
    if (d >= 0) respDurations.push(d)
  }
  const avgResponseDays =
    respDurations.length > 0 ? Math.round((respDurations.reduce((a, b) => a + b, 0) / respDurations.length) * 10) / 10 : null

  return {
    total,
    interviewed,
    offer,
    rejected,
    interviewRate: pct(interviewed, total),
    offerRate: pct(offer, total),
    rejectionRate: pct(rejected, total),
    responseRate: respDurations.length > 0 ? Math.round((respDurations.length / total) * 1000) / 10 : null,
    avgResponseDays,
  }
}

export function statusBreakdown(applications: Application[]) {
  return STATUS_ORDER.map((s) => ({
    status: s,
    count: applications.filter((a) => a.status === s && !a.archived).length,
  }))
}

export function companyStats(
  applications: Application[],
  interviews: { application_id: string }[],
  companyId: string,
) {
  const apps = applications.filter((a) => a.company_id === companyId)
  const live = apps.filter((a) => !a.archived)
  return {
    applications: live.length,
    total: apps.length,
    active: live.filter((a) => ACTIVE.includes(a.status)).length,
    offers: live.filter((a) => a.status === "offer").length,
    rejected: live.filter((a) => a.status === "rejected").length,
    interviews: interviews.filter((iv) => live.some((a) => a.id === iv.application_id)).length,
  }
}

interface JobEventLike {
  application_id: string
  event_type: string
  created_at?: string
  metadata?: Record<string, unknown> | null
}
