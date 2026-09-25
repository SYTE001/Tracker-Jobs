import { useMemo, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Plus, Briefcase, CalendarDays, BellRing, ArrowRight } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap, useActiveReminders, useDueCounts } from "@/store/selectors"
import { STATUS_ORDER, STATUS_META, SOURCE_LABELS } from "@/lib/constants"
import { isDatePast, isDateUpcoming, isDateToday, formatDate, daysUntil, relativeTime } from "@/lib/dates"
import { useJobCounts } from "@/features/metrics/metrics"
import { Button } from "@/components/ui/button"
import { CompanyLogo, EmptyState, StatusBadge, PageHeader } from "@/components/shared"
import { ApplicationDetail } from "@/features/applications/ApplicationDetail"
import { ApplicationFormModal } from "@/features/applications/ApplicationFormModal"
import { ScheduleFollowupModal } from "@/features/followups/ScheduleFollowupModal"
import { cn } from "@/lib/utils"

function Kpi({ label, value, to, onClick, accent }: { label: string; value: number; to?: string; onClick?: () => void; accent?: string }) {
  const inner = (
    <button
      onClick={onClick}
      className="group w-full rounded-lg border border-border bg-card p-4 text-left transition-shadow hover:shadow-sm"
    >
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums tracking-tight", accent)}>{value}</p>
    </button>
  )
  return to ? <Link to={to} className="block w-full">{inner}</Link> : <div className="w-full">{inner}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>
}

export function OverviewPage() {
  const navigate = useNavigate()
  const applications = useJobStore((s) => s.applications)
  const companies = useJobStore((s) => s.companies)
  const companyMap = useCompanyMap()
  const interviews = useJobStore((s) => s.interviews)
  const recentEvents = useJobStore((s) => s.application_events)
  const counts = useJobCounts()
  const due = useDueCounts()
  const activeReminders = useActiveReminders()

  const [detailId, setDetailId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [followupFor, setFollowupFor] = useState<string | null>(null)

  const upcomingInterviews = useMemo(
    () => interviews.filter((iv) => isDateUpcoming(iv.date)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    [interviews],
  )
  const recent = useMemo(
    () => [...applications].sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "")).slice(0, 5),
    [applications],
  )

  const detailApp = detailId ? applications.find((a) => a.id === detailId) ?? null : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add job</Button>}
      />

      {applications.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title="You have no applications yet"
          description="Add your first application and track it through every stage."
          action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add your first job</Button>}
        />
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Kpi label="Total applications" value={counts.total} onClick={() => navigate("/applications")} />
            <Kpi label="Active" value={counts.active} onClick={() => navigate("/applications?status=applied")} accent="text-blue-600 dark:text-blue-400" />
            <Kpi label="Interviews" value={counts.interviews} onClick={() => navigate("/interviews")} accent="text-violet-600 dark:text-violet-400" />
            <Kpi label="Offers" value={counts.offers} onClick={() => navigate("/applications?status=offer")} accent="text-emerald-600 dark:text-emerald-400" />
            <Kpi label="Follow-ups due" value={due.overdue + due.today} onClick={() => navigate("/followups")} accent="text-amber-600 dark:text-amber-400" />
          </div>

          {/* Actions row */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Follow-ups due */}
            <section className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <SectionTitle>Follow-ups due</SectionTitle>
                <Link to="/followups" className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
              </div>
              {activeReminders.slice(0, 4).map(({ reminder }) => {
                const app = applications.find((a) => a.id === reminder.application_id)
                return (
                  <button key={reminder.id} onClick={() => app && setDetailId(app.id)} className="mb-2 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-accent">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{app?.job_title ?? "Application"}</p>
                      <p className={cn("text-xs", isDatePast(reminder.reminder_date) ? "font-medium text-destructive" : "text-muted-foreground")}>
                        {isDatePast(reminder.reminder_date) ? "Overdue" : isDateToday(reminder.reminder_date) ? "Due today" : `Due ${formatDate(reminder.reminder_date)}`}
                      </p>
                    </div>
                    <BellRing className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                )
              })}
              {activeReminders.length === 0 && <p className="text-sm text-muted-foreground">You're all caught up.</p>}
            </section>

            {/* Upcoming interviews */}
            <section className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <SectionTitle>Upcoming interviews</SectionTitle>
                <Link to="/interviews" className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
              </div>
              {upcomingInterviews.map((iv) => {
                const app = applications.find((a) => a.id === iv.application_id)
                const company = app ? companyMap.get(app.company_id) : undefined
                const d = daysUntil(iv.date)
                return (
                  <button key={iv.id} onClick={() => app && setDetailId(app.id)} className="mb-2 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-accent">
                    <CalendarDays className="h-4 w-4 shrink-0 text-violet-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{app?.job_title ?? "Interview"}</p>
                      <p className="truncate text-xs text-muted-foreground">{company?.name}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {d === 0 ? "Today" : d === 1 ? "Tomorrow" : formatDate(iv.date, "MMM d")}
                    </span>
                  </button>
                )
              })}
              {upcomingInterviews.length === 0 && <p className="text-sm text-muted-foreground">No upcoming interviews.</p>}
            </section>

            {/* Recently updated */}
            <section className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <SectionTitle>Recently updated</SectionTitle>
                <Link to="/applications" className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
              </div>
              {recent.map((app) => (
                <button key={app.id} onClick={() => setDetailId(app.id)} className="mb-2 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-accent">
                  <CompanyLogo company={companyMap.get(app.company_id)} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{app.job_title}</p>
                    <p className="truncate text-xs text-muted-foreground">{relativeTime(app.updated_at)}</p>
                  </div>
                  <span className="ml-auto"><StatusBadge status={app.status} /></span>
                </button>
              ))}
            </section>
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <StatusDistribution applications={applications} />
            <SourcePerformance applications={applications} />
            <RecentActivity events={recentEvents} companies={companies} applicationMap={applications} onOpen={(id) => setDetailId(id)} />
          </div>
        </div>
      )}

      <ApplicationDetail application={detailApp} open={Boolean(detailApp)} onOpenChange={(o) => !o && setDetailId(null)} />
      <ApplicationFormModal open={addOpen} onOpenChange={setAddOpen} />
      <ScheduleFollowupModal open={Boolean(followupFor)} onOpenChange={(o) => !o && setFollowupFor(null)} applicationId={followupFor ?? ""} />
    </div>
  )
}

/* Status distribution — segment list (no decorative chart) */
import { BarChart3 } from "lucide-react"
function StatusDistribution({ applications }: { applications: JobApplication[] }) {
  const navigate = useNavigate()
  const counts = STATUS_ORDER.map((s) => ({ status: s, count: applications.filter((a) => a.status === s).length }))
  const total = applications.length || 1
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>Status distribution</SectionTitle>
        <Link to="/metrics"><BarChart3 className="h-4 w-4 text-muted-foreground" /></Link>
      </div>
      <div className="space-y-2">
        {counts.map(({ status, count }) => (
          <button key={status} onClick={() => navigate(`/applications?status=${status}`)} className="block w-full">
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", STATUS_META[status].dot)} />
                {STATUS_META[status].label}
              </span>
              <span className="tabular-nums text-muted-foreground">{count}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", STATUS_META[status].dot)} style={{ width: `${(count / total) * 100}%` }} />
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function SourcePerformance({ applications }: { applications: JobApplication[] }) {
  const sources = Object.entries(
    applications.reduce<Record<string, number>>((acc, a) => {
      acc[a.source] = (acc[a.source] ?? 0) + 1
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])
  const total = applications.length || 1
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <SectionTitle>Applications by source</SectionTitle>
      <div className="mt-3 space-y-2">
        {sources.map(([source, count]) => (
          <div key={source} className="flex items-center justify-between text-[13px]">
            <span>{SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] ?? source}</span>
            <span className="tabular-nums text-muted-foreground">{count}</span>
            <div className="ml-3 h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(count / total) * 100}%` }} />
            </div>
          </div>
        ))}
        {sources.length === 0 && <p className="text-sm text-muted-foreground">No source data yet.</p>}
      </div>
    </section>
  )
}

function RecentActivity({
  events,
  companies,
  applicationMap,
  onOpen,
}: {
  events: JobEvent[]
  companies: JobCompany[]
  applicationMap: JobApplication[]
  onOpen: (id: string) => void
}) {
  const companyMap = new Map(companies.map((c) => [c.id, c.name]))
  const recent = [...events].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).slice(0, 6)
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <SectionTitle>Recent activity</SectionTitle>
      {recent.map((e) => {
        const app = applicationMap.find((a) => a.id === e.application_id)
        return (
          <button key={e.id} onClick={() => onOpen(e.application_id)} className="mt-2 block w-full rounded-md px-1 py-1 text-left hover:bg-accent">
            <p className="text-sm font-medium">{e.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {app ? `${app.job_title} · ${companyMap.get(app.company_id) ?? ""}` : "Application"} · {relativeTime(e.created_at)}
            </p>
          </button>
        )
      })}
      {recent.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No activity yet.</p>}
    </section>
  )
}

import type { Application as JobApplication, ApplicationEvent as JobEvent, Company as JobCompany } from "@/types"
