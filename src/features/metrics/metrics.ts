import { useMemo } from "react"
import { useJobStore } from "@/store/useJobStore"
import type { Application, ApplicationEvent, Interview, JobStatus, Source, WorkMode } from "@/types"
import { STATUS_ORDER, SOURCE_LABELS, WORK_MODE_LABELS } from "@/lib/constants"
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

/* ------------------------------------------------------------------ */
/* Historical derivation — count what *happened*, not just current    */
/* status. An Applied → Interviewing → Rejected app still interviewed. */
/* ------------------------------------------------------------------ */

/** Application ids that ever reached the interviewing stage. */
export function everInterviewedSet(
  applications: Application[],
  events: ApplicationEvent[],
  interviews: Interview[],
): Set<string> {
  const set = new Set<string>()
  for (const a of applications) if (a.status === "interviewing" || a.status === "offer") set.add(a.id)
  for (const iv of interviews) set.add(iv.application_id)
  for (const e of events) {
    if (e.event_type === "interview_scheduled" || e.event_type === "interview_completed") set.add(e.application_id)
    if (e.event_type === "status_changed" && (e.metadata?.to === "interviewing" || e.metadata?.to === "offer"))
      set.add(e.application_id)
  }
  return set
}

/** Application ids that ever received an offer. */
export function everOfferedSet(applications: Application[], events: ApplicationEvent[]): Set<string> {
  const set = new Set<string>()
  for (const a of applications) if (a.status === "offer") set.add(a.id)
  for (const e of events) {
    if (e.event_type === "offer_received") set.add(e.application_id)
    if (e.event_type === "status_changed" && e.metadata?.to === "offer") set.add(e.application_id)
  }
  return set
}

/** Application ids that were ever rejected. */
export function everRejectedSet(applications: Application[], events: ApplicationEvent[]): Set<string> {
  const set = new Set<string>()
  for (const a of applications) if (a.status === "rejected") set.add(a.id)
  for (const e of events) {
    if (e.event_type === "rejection_received") set.add(e.application_id)
    if (e.event_type === "status_changed" && e.metadata?.to === "rejected") set.add(e.application_id)
  }
  return set
}

/** Application ids that received any meaningful response after applying. */
export function respondedSet(
  applications: Application[],
  events: ApplicationEvent[],
  interviews: Interview[],
): Set<string> {
  const set = new Set<string>()
  const interviewed = everInterviewedSet(applications, events, interviews)
  for (const id of interviewed) set.add(id)
  for (const a of applications) if (a.status === "offer" || a.status === "rejected") set.add(a.id)
  for (const e of events) {
    if (e.event_type === "recruiter_replied" || e.event_type === "offer_received" || e.event_type === "rejection_received")
      set.add(e.application_id)
  }
  return set
}

/** Interval counts of applications submitted per week, last N weeks. */
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
  responded: number
  interviewRate: number | null
  offerRate: number | null
  rejectionRate: number | null
  responseRate: number | null
  avgResponseDays: number | null
}

/** Conversion metrics derived from lifecycle history (null when denominator is 0). */
export function computeMetrics(
  applications: Application[],
  events: ApplicationEvent[],
  interviews: Interview[] = [],
): FunnelMeter {
  const live = applications.filter((a) => !a.archived)
  const total = live.length
  const liveIds = new Set(live.map((a) => a.id))

  const interviewed = [...everInterviewedSet(live, events, interviews)].filter((id) => liveIds.has(id)).length
  const offer = [...everOfferedSet(live, events)].filter((id) => liveIds.has(id)).length
  const rejected = [...everRejectedSet(live, events)].filter((id) => liveIds.has(id)).length
  const responded = [...respondedSet(live, events, interviews)].filter((id) => liveIds.has(id)).length

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : null)

  // Average time to first response: applied_date → first status_changed away from applied/wishlist.
  const respDurations: number[] = []
  for (const app of live) {
    if (!app.applied_date) continue
    const evts = events
      .filter((e) => e.application_id === app.id && e.event_type === "status_changed")
      .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))
    const first = evts.find((e) => e.metadata?.from === "applied" || e.metadata?.to === "interviewing")
    if (!first || !first.created_at) continue
    const d = differenceInCalendarDays(parseISO(first.created_at), parseISO(app.applied_date))
    if (d >= 0) respDurations.push(d)
  }
  const avgResponseDays =
    respDurations.length > 0
      ? Math.round((respDurations.reduce((a, b) => a + b, 0) / respDurations.length) * 10) / 10
      : null

  return {
    total,
    interviewed,
    offer,
    rejected,
    responded,
    interviewRate: pct(interviewed, total),
    offerRate: pct(offer, total),
    rejectionRate: pct(rejected, total),
    responseRate: pct(responded, total),
    avgResponseDays,
  }
}

export function statusBreakdown(applications: Application[]) {
  return STATUS_ORDER.map((s) => ({
    status: s,
    count: applications.filter((a) => a.status === s && !a.archived).length,
  }))
}

export interface SourceRow {
  source: Source
  label: string
  applications: number
  interviews: number
  offers: number
  interviewRate: number | null
}

/** Per-source performance: which channels actually produce interviews/offers. */
export function sourcePerformance(
  applications: Application[],
  events: ApplicationEvent[],
  interviews: Interview[],
): SourceRow[] {
  const live = applications.filter((a) => !a.archived)
  const interviewed = everInterviewedSet(live, events, interviews)
  const offered = everOfferedSet(live, events)
  const bySource = new Map<Source, { apps: number; interviews: number; offers: number }>()
  for (const a of live) {
    const cur = bySource.get(a.source) ?? { apps: 0, interviews: 0, offers: 0 }
    cur.apps += 1
    if (interviewed.has(a.id)) cur.interviews += 1
    if (offered.has(a.id)) cur.offers += 1
    bySource.set(a.source, cur)
  }
  return [...bySource.entries()]
    .map(([source, v]) => ({
      source,
      label: SOURCE_LABELS[source] ?? source,
      applications: v.apps,
      interviews: v.interviews,
      offers: v.offers,
      interviewRate: v.apps > 0 ? Math.round((v.interviews / v.apps) * 1000) / 10 : null,
    }))
    .sort((a, b) => b.applications - a.applications)
}

/** Distribution of live applications across work modes. */
export function workModeDistribution(applications: Application[]) {
  const live = applications.filter((a) => !a.archived)
  const modes: (WorkMode | "unspecified")[] = ["remote", "hybrid", "onsite", "unspecified"]
  return modes
    .map((mode) => ({
      mode,
      label: mode === "unspecified" ? "Unspecified" : WORK_MODE_LABELS[mode as WorkMode],
      count: live.filter((a) => (a.work_mode ?? "unspecified") === mode).length,
    }))
    .filter((r) => r.count > 0)
}

/** Salary midpoint buckets (only meaningful when enough data exists). */
export function salaryDistribution(applications: Application[]) {
  const mids = applications
    .filter((a) => !a.archived)
    .map((a) => {
      if (a.salary_min != null && a.salary_max != null) return (a.salary_min + a.salary_max) / 2
      return a.salary_min ?? a.salary_max ?? null
    })
    .filter((v): v is number => v != null && v > 0)
  return mids
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
