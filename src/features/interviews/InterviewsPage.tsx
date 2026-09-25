import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  Plus,
  MapPin,
  Video,
  ExternalLink,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
} from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap } from "@/store/selectors"
import { formatDate, daysUntil, dayLabel, isDateUpcoming } from "@/lib/dates"
import { INTERVIEW_TYPE_LABELS } from "@/lib/constants"
import type { Interview } from "@/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown"
import { CompanyLogo, EmptyState, PageHeader, Section, ConfirmDialog } from "@/components/shared"
import { AddInterviewModal } from "./AddInterviewModal"

const RESULT_PRESETS = ["Passed", "Advanced to next round", "Rejected", "Withdrawn", "No decision yet"]

export function InterviewsPage() {
  const interviews = useJobStore((s) => s.interviews)
  const applications = useJobStore((s) => s.applications)
  const companyMap = useCompanyMap()
  const updateInterview = useJobStore((s) => s.updateInterview)
  const deleteInterview = useJobStore((s) => s.deleteInterview)
  const navigate = useNavigate()

  const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming")
  const [open, setOpen] = useState(false)
  const [pickApp, setPickApp] = useState("")
  const [editing, setEditing] = useState<Interview | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const sorted = [...interviews].sort((a, b) => a.date.localeCompare(b.date))
    return {
      upcoming: sorted.filter((iv) => isDateUpcoming(iv.date)),
      past: sorted.filter((iv) => !isDateUpcoming(iv.date)).reverse(),
      all: sorted,
    }
  }, [interviews])

  const list = grouped[tab]
  const nextInterview = grouped.upcoming[0]

  const appPicks = applications.filter(
    (a) => !a.archived && (a.status === "interviewing" || a.status === "applied" || a.status === "offer"),
  )

  const appFor = (id: string) => applications.find((a) => a.id === id)
  const openAdd = () => {
    setEditing(null)
    setPickApp((p) => p || appPicks[0]?.id || "")
    setOpen(true)
  }
  const openEdit = (iv: Interview) => {
    setEditing(iv)
    setOpen(true)
  }

  const timeLabel = (iv: Interview) =>
    [iv.start_time, iv.end_time].filter(Boolean).join("–")

  /* ------------------------------- Next interview (L3) ------------------------------- */
  const NextInterviewCard = () => {
    if (!nextInterview) return null
    const iv = nextInterview
    const app = appFor(iv.application_id)
    const company = app ? companyMap.get(app.company_id) : undefined
    const d = daysUntil(iv.date)
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Next interview
          </span>
          <span className="tnum text-xs font-medium text-foreground">
            {d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${dayLabel(d)}`}
          </span>
        </div>
        <div className="mt-3 flex items-start gap-3">
          <CompanyLogo company={company} size="lg" />
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => app && navigate(`/applications/${app.id}`)}
              className="rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="truncate text-[15px] font-semibold">{app?.job_title ?? "Application"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {company?.name ? `${company.name} · ` : ""}
                {iv.stage || "Interview"} · {INTERVIEW_TYPE_LABELS[iv.type]}
              </p>
            </button>
            <p className="tnum mt-1.5 text-sm">
              {formatDate(iv.date)}
              {timeLabel(iv) && <span className="text-muted-foreground"> · {timeLabel(iv)}</span>}
            </p>
          </div>
          {iv.meeting_url && (
            <a
              href={iv.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "sm" })}
            >
              <Video className="h-4 w-4" />
              Join
            </a>
          )}
        </div>
      </div>
    )
  }

  /* ------------------------------- Row (L2) ------------------------------- */
  const Row = ({ iv }: { iv: Interview }) => {
    const app = appFor(iv.application_id)
    const company = app ? companyMap.get(app.company_id) : undefined
    const d = daysUntil(iv.date)
    const upcoming = isDateUpcoming(iv.date)
    return (
      <div className="group rounded-md border border-transparent px-2.5 py-2.5 transition-colors hover:bg-accent/60">
        <div className="flex items-start gap-3">
          <CompanyLogo company={company} size="md" />
          <button
            type="button"
            onClick={() => app && navigate(`/applications/${app.id}`)}
            className="min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Open ${app?.job_title ?? "application"}`}
          >
            <p className="truncate text-sm font-medium">{app?.job_title ?? "Application"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {company?.name ? `${company.name} · ` : ""}
              {iv.stage || "Interview"} · {INTERVIEW_TYPE_LABELS[iv.type]}
            </p>
            {(iv.interviewer || iv.location) && (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 truncate text-xs text-muted-foreground">
                {iv.interviewer && <span>{iv.interviewer}</span>}
                {iv.location && (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {iv.location}
                  </span>
                )}
              </p>
            )}
            {iv.result && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                {iv.result}
              </span>
            )}
          </button>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <p className="tnum text-sm font-medium">{formatDate(iv.date, "MMM d")}</p>
            <p className="tnum text-xs text-muted-foreground">
              {timeLabel(iv)}
              {upcoming && d !== null && (
                <span className="ml-1 text-foreground">
                  {d === 0 ? "· Today" : d === 1 ? "· Tomorrow" : `· in ${d}d`}
                </span>
              )}
            </p>
            <div className="flex items-center gap-0.5">
              {iv.meeting_url && (
                <a
                  href={iv.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join meeting"
                  className={buttonVariants({ size: "iconSm", variant: "ghost" })}
                >
                  <Video className="h-4 w-4" />
                </a>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="iconSm" variant="ghost" aria-label="Interview actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {app && (
                    <DropdownMenuItem onSelect={() => navigate(`/applications/${app.id}`)}>
                      <ExternalLink className="h-4 w-4" />
                      Open application
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => openEdit(iv)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(iv.id)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {!iv.result && (
              <Select
                aria-label="Set interview result"
                value=""
                onChange={(e) => {
                  if (e.target.value) updateInterview(iv.id, { result: e.target.value })
                }}
                className="h-7 w-[132px] text-xs"
              >
                <option value="">Set result…</option>
                {RESULT_PRESETS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Interviews"
        description="Your schedule — what's next and every past stage."
        action={
          appPicks.length > 0 ? (
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add interview
            </Button>
          ) : undefined
        }
      />

      {tab !== "past" && <NextInterviewCard />}

      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {(["upcoming", "past", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors " +
              (tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {appPicks.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <label htmlFor="iv_pick" className="shrink-0 text-sm text-muted-foreground">
            Add for
          </label>
          <Select id="iv_pick" value={pickApp} onChange={(e) => setPickApp(e.target.value)} className="min-w-0">
            <option value="">Select an application…</option>
            {appPicks.map((a) => (
              <option key={a.id} value={a.id}>
                {a.job_title} · {companyMap.get(a.company_id)?.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title={
            tab === "upcoming"
              ? "No upcoming interviews."
              : tab === "past"
                ? "No past interviews."
                : "No interviews yet."
          }
          description="Add an interview to keep track of every stage and what needs preparation."
          action={
            appPicks.length > 0 ? (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" />
                Add interview
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/applications")}>
                Go to applications
              </Button>
            )
          }
        />
      ) : (
        <Section bodyClassName="space-y-0.5">
          {list.map((iv) => (
            <Row key={iv.id} iv={iv} />
          ))}
        </Section>
      )}

      <AddInterviewModal
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setEditing(null)
        }}
        applicationId={editing ? editing.application_id : pickApp}
        interview={editing ?? undefined}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete interview?"
        description="This removes the interview record. This action cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDelete) deleteInterview(confirmDelete)
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}
