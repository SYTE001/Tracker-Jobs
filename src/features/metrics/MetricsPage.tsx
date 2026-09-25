import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Link } from "react-router-dom"
import { TrendingUp, BarChart3, Plus } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import {
  useJobCounts,
  applicationsPerWeek,
  computeMetrics,
  statusBreakdown,
} from "./metrics"
import { STATUS_META, SOURCE_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { EmptyState, PageHeader } from "@/components/shared"
import { ApplicationFormModal } from "@/features/applications/ApplicationFormModal"
import { useState } from "react"
import { cn } from "@/lib/utils"

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

export function MetricsPage() {
  const applications = useJobStore((s) => s.applications)
  const companies = useJobStore((s) => s.companies)
  const events = useJobStore((s) => s.application_events)
  const counts = useJobCounts()
  const [addOpen, setAddOpen] = useState(false)

  const weekly = useMemo(() => applicationsPerWeek(applications, 10), [applications])
  const funnel = useMemo(() => computeMetrics(applications, events), [applications, events])
  const statuses = useMemo(() => statusBreakdown(applications), [applications])

  const sourceData = useMemo(() => {
    const map = applications.reduce<Record<string, number>>((acc, a) => {
      if (a.archived) return acc
      acc[a.source] = (acc[a.source] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([k, v]) => ({ name: SOURCE_LABELS[k as keyof typeof SOURCE_LABELS] ?? k, value: v }))
  }, [applications])

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Metrics" description="How your job search is performing." />
        <EmptyState
          icon={<TrendingUp className="h-5 w-5" />}
          title="Add a few applications to unlock useful metrics"
          description="Your funnel, sources, and response times will appear here as you track."
          action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add your first job</Button>}
        />
        <ApplicationFormModal open={addOpen} onOpenChange={setAddOpen} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Metrics" description="Factual numbers from your tracked applications." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total", value: funnel.total },
          { label: "Interviewed", value: funnel.interviewed },
          { label: "Offers", value: funnel.offer },
          { label: "Rejected", value: funnel.rejected },
          { label: "Ghosted", value: counts.ghosted },
          { label: "Response rate", value: funnel.responseRate != null ? `${funnel.responseRate}%` : "—" },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-card p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Applications per week">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Funnel conversion">
          <div className="space-y-2">
            <FunnelRow label="Applications" value={funnel.total} pct={100} />
            <FunnelRow label="Interview rate" value={funnel.interviewRate} sub={`${funnel.interviewed} interviewed`} />
            <FunnelRow label="Offer rate" value={funnel.offerRate} sub={`${funnel.offer} offers`} />
            <FunnelRow label="Rejection rate" value={funnel.rejectionRate} sub={`${funnel.rejected} rejected`} />
            <FunnelRow label="Response rate" value={funnel.responseRate} sub="got a reply" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Avg time to first response: <span className="font-medium text-foreground">{funnel.avgResponseDays != null ? `${funnel.avgResponseDays} days` : "—"}</span>
          </p>
        </Card>

        <Card title="Applications by source">
          <div className="space-y-2">
            {sourceData.map((s) => {
              const pct = funnel.total ? Math.round((s.value / funnel.total) * 100) : 0
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span>{s.name}</span>
                    <span className="tabular-nums text-muted-foreground">{s.value}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {sourceData.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
          </div>
        </Card>

        <Card title="Status breakdown">
          <div className="space-y-2">
            {statuses.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", STATUS_META[s.status].dot)} />
                  {STATUS_META[s.status].label}
                </span>
                <span className="tabular-nums text-muted-foreground">{s.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/applications" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <BarChart3 className="h-3.5 w-3.5" /> View all applications
            </Link>
          </div>
        </Card>
      </div>

      {/* Companies without a job remain reachable via Companies page */}
      <p className="text-center text-xs text-muted-foreground">
        Viewing real data only — every number here is calculated from your {applications.length} applications and {companies.length} companies.
      </p>
    </div>
  )
}

function FunnelRow({ label, value, sub, pct }: { label: string; value: number | null; sub?: string; pct?: number }) {
  const show = value != null ? value : null
  const width = pct != null ? pct : value != null ? value : 0
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          {show != null && <span className="tabular-nums font-medium">{show}%</span>}
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}