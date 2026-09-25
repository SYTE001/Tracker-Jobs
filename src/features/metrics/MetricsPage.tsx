import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  sourcePerformance,
  workModeDistribution,
  salaryDistribution,
} from "./metrics"
import type { Application, JobStatus, Source, WorkMode, JobType } from "@/types"
import { STATUSES, SOURCES, WORK_MODES, JOB_TYPES } from "@/types"
import {
  STATUS_META,
  SOURCE_LABELS,
  WORK_MODE_LABELS,
  JOB_TYPE_LABELS,
} from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { EmptyState, PageHeader, Section, FilterChip } from "@/components/shared"
import { ApplicationFormModal } from "@/features/applications/ApplicationFormModal"
import { cn } from "@/lib/utils"

type RangeKey = "4" | "8" | "12" | "all"

const RANGE_LABELS: Record<RangeKey, string> = {
  "4": "Last 4 weeks",
  "8": "Last 8 weeks",
  "12": "Last 12 weeks",
  all: "All time",
}

const CHART_INK = "hsl(var(--primary))"
const CHART_MUTED = "hsl(var(--muted-foreground))"
const TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
} as const

export function MetricsPage() {
  const applications = useJobStore((s) => s.applications)
  const events = useJobStore((s) => s.application_events)
  const interviews = useJobStore((s) => s.interviews)
  const settings = useJobStore((s) => s.settings)
  const counts = useJobCounts()
  const [addOpen, setAddOpen] = useState(false)

  // ---- Filters (component state, §16.4) --------------------------------
  const [range, setRange] = useState<RangeKey>("all")
  const [source, setSource] = useState<Source | "all">("all")
  const [status, setStatus] = useState<JobStatus | "all">("all")
  const [mode, setMode] = useState<WorkMode | "unspecified" | "all">("all")
  const [type, setType] = useState<JobType | "all">("all")

  const weeks = range === "all" ? 12 : Number(range)

  const filtered = useMemo<Application[]>(() => {
    let cutoff: number | null = null
    if (range !== "all") {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - Number(range) * 7)
      cutoff = d.getTime()
    }
    return applications.filter((a) => {
      if (a.archived) return false
      if (cutoff != null) {
        const ts = a.applied_date ?? a.created_at
        if (!ts || new Date(ts).getTime() < cutoff) return false
      }
      if (source !== "all" && a.source !== source) return false
      if (status !== "all" && a.status !== status) return false
      if (mode !== "all" && (a.work_mode ?? "unspecified") !== mode) return false
      if (type !== "all" && a.job_type !== type) return false
      return true
    })
  }, [applications, range, source, status, mode, type])

  const weekly = useMemo(() => applicationsPerWeek(filtered, weeks), [filtered, weeks])
  const funnel = useMemo(
    () => computeMetrics(filtered, events, interviews),
    [filtered, events, interviews],
  )
  const statuses = useMemo(
    () => statusBreakdown(filtered).filter((s) => s.count > 0),
    [filtered],
  )
  const sources = useMemo(
    () => sourcePerformance(filtered, events, interviews),
    [filtered, events, interviews],
  )
  const modes = useMemo(() => workModeDistribution(filtered), [filtered])
  const salary = useMemo(() => salaryDistribution(filtered), [filtered])

  const active = useMemo(
    () => filtered.filter((a) => ["applied", "interviewing", "offer"].includes(a.status)).length,
    [filtered],
  )

  const activeChips = [
    range !== "all" && { key: "range", label: "Range", value: RANGE_LABELS[range], clear: () => setRange("all") },
    source !== "all" && { key: "source", label: "Source", value: SOURCE_LABELS[source], clear: () => setSource("all") },
    status !== "all" && { key: "status", label: "Status", value: STATUS_META[status].label, clear: () => setStatus("all") },
    mode !== "all" && {
      key: "mode",
      label: "Work mode",
      value: mode === "unspecified" ? "Unspecified" : WORK_MODE_LABELS[mode],
      clear: () => setMode("all"),
    },
    type !== "all" && { key: "type", label: "Type", value: JOB_TYPE_LABELS[type], clear: () => setType("all") },
  ].filter(Boolean) as { key: string; label: string; value: string; clear: () => void }[]

  const clearAll = () => {
    setRange("all")
    setSource("all")
    setStatus("all")
    setMode("all")
    setType("all")
  }

  const pctText = (v: number | null) => (v != null ? `${v}%` : "—")

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Metrics" description="How your job search is performing." />
        <EmptyState
          icon={<TrendingUp className="h-5 w-5" />}
          title="Add a few applications to unlock useful metrics"
          description="Your funnel, sources, and response times will appear here as you track."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first job
            </Button>
          }
        />
        <ApplicationFormModal open={addOpen} onOpenChange={setAddOpen} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Metrics"
        description="Historical analysis of your pipeline — every number is derived from what actually happened."
      />

      {/* ---- Filters -------------------------------------------------- */}
      <div className="space-y-2">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterSelect
            label="Time range"
            value={range}
            onChange={(v) => setRange(v as RangeKey)}
            options={(Object.keys(RANGE_LABELS) as RangeKey[]).map((k) => ({ value: k, label: RANGE_LABELS[k] }))}
          />
          <FilterSelect
            label="Source"
            value={source}
            onChange={(v) => setSource(v as Source | "all")}
            options={[{ value: "all", label: "All sources" }, ...SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))]}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as JobStatus | "all")}
            options={[{ value: "all", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))]}
          />
          <FilterSelect
            label="Work mode"
            value={mode}
            onChange={(v) => setMode(v as WorkMode | "unspecified" | "all")}
            options={[
              { value: "all", label: "All modes" },
              ...WORK_MODES.map((m) => ({ value: m, label: WORK_MODE_LABELS[m] })),
              { value: "unspecified", label: "Unspecified" },
            ]}
          />
          <FilterSelect
            label="Job type"
            value={type}
            onChange={(v) => setType(v as JobType | "all")}
            options={[{ value: "all", label: "All types" }, ...JOB_TYPES.map((t) => ({ value: t, label: JOB_TYPE_LABELS[t] }))]}
          />
        </div>
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeChips.map((c) => (
              <FilterChip key={c.key} label={c.label} value={c.value} onRemove={c.clear} />
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="rounded-sm px-1.5 py-1 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon={<BarChart3 className="h-5 w-5" />}
          title="No applications match these filters"
          description="Widen the time range or clear a filter to see metrics."
          action={
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* ---- KPI strip -------------------------------------------- */}
          <div className="grid grid-cols-2 divide-border rounded-lg border border-border bg-card sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
            <Kpi label="Applications" value={filtered.length} />
            <Kpi label="Active" value={active} />
            <Kpi label="Interviewed" value={funnel.interviewed} />
            <Kpi label="Offers" value={funnel.offer} />
            <Kpi label="Interview rate" value={pctText(funnel.interviewRate)} />
            <Kpi label="Response rate" value={pctText(funnel.responseRate)} />
          </div>

          {/* ---- Volume ----------------------------------------------- */}
          <Section
            title="Application volume"
            description={`Applications submitted per week${range === "all" ? " (last 12 weeks)" : `, ${RANGE_LABELS[range].toLowerCase()}`}.`}
          >
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART_MUTED }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CHART_MUTED }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Applications" fill={CHART_INK} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* ---- Funnel -------------------------------------------- */}
            <Section
              title="Stage conversion"
              description="How far applications progress through the pipeline."
            >
              <div className="space-y-3">
                <FunnelRow label="Applied" count={funnel.total} pct={100} />
                <FunnelRow
                  label="Interviewed"
                  count={funnel.interviewed}
                  pct={funnel.total ? Math.round((funnel.interviewed / funnel.total) * 100) : 0}
                  rate={pctText(funnel.interviewRate)}
                />
                <FunnelRow
                  label="Offer"
                  count={funnel.offer}
                  pct={funnel.total ? Math.round((funnel.offer / funnel.total) * 100) : 0}
                  rate={pctText(funnel.offerRate)}
                />
                <FunnelRow
                  label="Rejected"
                  count={funnel.rejected}
                  pct={funnel.total ? Math.round((funnel.rejected / funnel.total) * 100) : 0}
                  rate={pctText(funnel.rejectionRate)}
                  tone="muted"
                />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Response rate</dt>
                  <dd className="mt-0.5 font-semibold tnum">{pctText(funnel.responseRate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Avg. time to first response</dt>
                  <dd className="mt-0.5 font-semibold tnum">
                    {funnel.avgResponseDays != null ? `${funnel.avgResponseDays} days` : "—"}
                  </dd>
                </div>
              </dl>
            </Section>

            {/* ---- Status distribution ------------------------------- */}
            <Section title="Status distribution" description="Where matching applications stand now.">
              <div className="space-y-2.5">
                {statuses.map((s) => {
                  const pct = filtered.length ? Math.round((s.count / filtered.length) * 100) : 0
                  return (
                    <div key={s.status}>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", STATUS_META[s.status].dot)} />
                          {STATUS_META[s.status].label}
                        </span>
                        <span className="tnum text-muted-foreground">
                          {s.count} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", STATUS_META[s.status].dot)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4">
                <Link to="/applications" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <BarChart3 className="h-3.5 w-3.5" /> View all applications
                </Link>
              </div>
            </Section>
          </div>

          {/* ---- Source performance ----------------------------------- */}
          <Section
            title="Source performance"
            description="Which channels actually produce interviews — not just volume."
          >
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No source data for this selection.</p>
            ) : (
              <>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sources} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART_MUTED }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CHART_MUTED }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="applications" name="Applied" fill={CHART_MUTED} radius={[3, 3, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="interviews" name="Interviewed" fill={CHART_INK} radius={[3, 3, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-1.5 text-[13px]">
                  {sources.map((s) => (
                    <li key={s.source} className="flex items-center justify-between">
                      <span>{s.label}</span>
                      <span className="tnum text-muted-foreground">
                        {s.interviews}/{s.applications} interviewed · {pctText(s.interviewRate)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* ---- Work mode ----------------------------------------- */}
            <Section title="Work-mode distribution" description="Remote, hybrid, or on-site mix.">
              {modes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No work-mode data.</p>
              ) : (
                <div className="space-y-2.5">
                  {modes.map((m) => {
                    const pct = filtered.length ? Math.round((m.count / filtered.length) * 100) : 0
                    return (
                      <div key={m.mode}>
                        <div className="flex items-center justify-between text-[13px]">
                          <span>{m.label}</span>
                          <span className="tnum text-muted-foreground">
                            {m.count} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>

            {/* ---- Salary distribution (only with enough data) -------- */}
            <Section title="Salary distribution" description="Advertised salary midpoints across matching roles.">
              <SalaryHistogram values={salary} currency={settings.currency} />
            </Section>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Showing {filtered.length} of {counts.total} active applications
            {activeChips.length > 0 ? " matching your filters" : ""}.
          </p>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex shrink-0 flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-40">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </label>
  )
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-border p-3 last:border-b-0 sm:[&:nth-child(3n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(3n)]:border-r">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tnum">{value}</p>
    </div>
  )
}

function FunnelRow({
  label,
  count,
  pct,
  rate,
  tone,
}: {
  label: string
  count: number
  pct: number
  rate?: string
  tone?: "muted"
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          <span className="tnum font-medium">{count}</span>
          {rate && <span className="text-xs text-muted-foreground tnum">{rate}</span>}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone === "muted" ? "bg-muted-foreground/50" : "bg-primary")}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

function SalaryHistogram({ values, currency }: { values: number[]; currency: string }) {
  const data = useMemo(() => {
    if (values.length < 5) return null
    const min = Math.min(...values)
    const max = Math.max(...values)
    if (max <= min) return null
    const bins = 5
    const width = (max - min) / bins
    const fmt = (n: number) =>
      new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n)
    const buckets = Array.from({ length: bins }, (_, i) => ({
      label: `${fmt(min + i * width)}–${fmt(min + (i + 1) * width)}`,
      count: 0,
    }))
    for (const v of values) {
      let idx = Math.floor((v - min) / width)
      if (idx >= bins) idx = bins - 1
      buckets[idx].count += 1
    }
    return buckets
  }, [values])

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Add salary details to at least 5 matching applications to see a distribution.
      </p>
    )
  }

  return (
    <>
      <p className="mb-2 text-xs text-muted-foreground">Amounts in {currency}.</p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART_MUTED }} axisLine={false} tickLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CHART_MUTED }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" name="Roles" fill={CHART_INK} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
