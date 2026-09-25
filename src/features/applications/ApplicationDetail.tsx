import { useEffect, useRef, useState } from "react"
import {
  X,
  ExternalLink,
  Archive,
  Trash2,
  CalendarPlus,
  CalendarDays,
  Pencil,
  RotateCcw,
  History,
  MoreHorizontal,
  Check,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  StickyNote,
  Mail,
  MailOpen,
  Award,
  XCircle,
  CheckCircle2,
  Plus,
  Video,
  Save,
} from "lucide-react"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import {
  useCompanyMap,
  useEventsFor,
  useInterviewsFor,
  useRemindersFor,
  useNextActionResolver,
} from "@/store/selectors"
import { STATUSES, type Application, type Interview, type Reminder, type InterviewType } from "@/types"
import type { EventType } from "@/types"
import type { NextAction, Urgency } from "@/lib/nextAction"
import {
  STATUS_META,
  SOURCE_LABELS,
  WORK_MODE_LABELS,
  JOB_TYPE_LABELS,
  PRIORITY_META,
  REMINDER_LABELS,
  INTERVIEW_TYPE_LABELS,
} from "@/lib/constants"
import { formatDate, relativeTime, daysUntil, dayLabel } from "@/lib/dates"
import { INTERVIEW_TYPES } from "@/types"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown"
import { CompanyLogo, StatusBadge, PriorityBadge, ConfirmDialog, DetailField } from "@/components/shared"
import { ApplicationFormModal } from "./ApplicationFormModal"
import { ScheduleFollowupModal } from "@/features/followups/ScheduleFollowupModal"
import { AddInterviewModal } from "@/features/interviews/AddInterviewModal"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Event timeline icons                                                */
/* ------------------------------------------------------------------ */
const EVENT_ICON: Record<EventType, React.ComponentType<{ className?: string }>> = {
  created: Plus,
  status_changed: ArrowRightLeft,
  note_added: StickyNote,
  interview_scheduled: CalendarDays,
  interview_completed: CheckCircle2,
  followup_scheduled: CalendarPlus,
  followup_completed: Check,
  reminder_completed: Check,
  recruiter_contacted: Mail,
  recruiter_replied: MailOpen,
  offer_received: Award,
  rejection_received: XCircle,
  archived: Archive,
  restored: RotateCcw,
}

/* Urgency accent for the next-action panel (semantic color only). */
function urgencyClasses(urgency: Urgency): { wrap: string; label: string; icon: React.ComponentType<{ className?: string }> } {
  switch (urgency) {
    case "overdue":
      return {
        wrap: "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40",
        label: "text-rose-700 dark:text-rose-300",
        icon: AlertTriangle,
      }
    case "today":
      return {
        wrap: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
        label: "text-amber-700 dark:text-amber-300",
        icon: Clock,
      }
    case "soon":
      return {
        wrap: "border-amber-200 bg-amber-50/60 dark:border-amber-900/70 dark:bg-amber-950/30",
        label: "text-amber-700 dark:text-amber-300",
        icon: Clock,
      }
    default:
      return {
        wrap: "border-border bg-muted/40",
        label: "text-foreground",
        icon: CalendarDays,
      }
  }
}

/** Gentle, non-destructive status suggestion after recording an interview result. */
function suggestStatusFromResult(result: string, app: Application, setStatus: (id: string, s: Application["status"]) => void) {
  const r = result.toLowerCase()
  if (/(offer|hired|accepted)/.test(r) && app.status !== "offer") {
    toast("Interview resulted in an offer", {
      description: "Move this application to Offer?",
      action: { label: "Move to Offer", onClick: () => setStatus(app.id, "offer") },
    })
  } else if (/(reject|declin|unsuccess|no offer|not moving)/.test(r) && app.status !== "rejected") {
    toast("Interview marked unsuccessful", {
      description: "Move this application to Rejected?",
      action: { label: "Move to Rejected", onClick: () => setStatus(app.id, "rejected") },
    })
  }
}

/* ------------------------------------------------------------------ */
/* Interview row — view + inline edit                                  */
/* ------------------------------------------------------------------ */
function InterviewRow({ interview, app }: { interview: Interview; app: Application }) {
  const updateInterview = useJobStore((s) => s.updateInterview)
  const deleteInterview = useJobStore((s) => s.deleteInterview)
  const setStatus = useJobStore((s) => s.setStatus)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({
    stage: interview.stage ?? "",
    type: interview.type,
    date: interview.date,
    start_time: interview.start_time ?? "",
    interviewer: interview.interviewer ?? "",
    meeting_url: interview.meeting_url ?? "",
    result: interview.result ?? "",
  })

  function save() {
    const hadResult = interview.result
    updateInterview(interview.id, {
      stage: form.stage || undefined,
      type: form.type as InterviewType,
      date: form.date,
      start_time: form.start_time || undefined,
      interviewer: form.interviewer || undefined,
      meeting_url: form.meeting_url || undefined,
      result: form.result || undefined,
    })
    toast.success("Interview updated")
    if (!hadResult && form.result.trim()) suggestStatusFromResult(form.result, app, setStatus)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-md border border-border bg-background p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Stage</span>
            <Input value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))} placeholder="Technical" />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Type</span>
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as InterviewType }))}>
              {INTERVIEW_TYPES.map((t) => (
                <option key={t} value={t}>{INTERVIEW_TYPE_LABELS[t]}</option>
              ))}
            </Select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Date</span>
            <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Start time</span>
            <Input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Interviewer</span>
            <Input value={form.interviewer} onChange={(e) => setForm((f) => ({ ...f, interviewer: e.target.value }))} placeholder="Name" />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Meeting URL</span>
            <Input value={form.meeting_url} onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))} placeholder="https://meet…" />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className="mb-1 block text-muted-foreground">Result</span>
            <Input value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))} placeholder="Passed / Offer / Rejected…" />
          </label>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          <Button size="sm" onClick={save}><Save className="h-3.5 w-3.5" /> Save</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{interview.stage || "Interview"}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {INTERVIEW_TYPE_LABELS[interview.type]}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground tnum">
            {formatDate(interview.date)}
            {interview.start_time ? ` • ${interview.start_time}` : ""}
          </p>
          {interview.interviewer && <p className="mt-0.5 text-xs text-muted-foreground">{interview.interviewer}</p>}
          {interview.result && (
            <p className="mt-1 text-xs">
              <span className="text-muted-foreground">Result: </span>
              <span className="font-medium">{interview.result}</span>
            </p>
          )}
          {interview.notes && <p className="mt-1 text-sm text-muted-foreground">{interview.notes}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {interview.meeting_url && (
            <a href={interview.meeting_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="iconSm" aria-label="Join meeting">
                <Video className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
          <Button variant="ghost" size="iconSm" onClick={() => setEditing(true)} aria-label="Edit interview">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setConfirmDelete(true)} aria-label="Delete interview">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete interview?"
        description="This removes the interview record from the timeline. This can’t be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          deleteInterview(interview.id)
          toast.success("Interview deleted")
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Reminder (follow-up) row                                            */
/* ------------------------------------------------------------------ */
function ReminderRow({ reminder }: { reminder: Reminder }) {
  const completeReminder = useJobStore((s) => s.completeReminder)
  const updateReminder = useJobStore((s) => s.updateReminder)
  const deleteReminder = useJobStore((s) => s.deleteReminder)
  const [rescheduling, setRescheduling] = useState(false)
  const [date, setDate] = useState(reminder.reminder_date)

  const overdue = !reminder.completed && (daysUntil(reminder.reminder_date) ?? 0) < 0
  const dueLabel = dayLabel(daysUntil(reminder.reminder_date))

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              reminder.completed ? "bg-emerald-500" : overdue ? "bg-rose-500" : "bg-amber-500",
            )}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className={cn("truncate text-sm", reminder.completed && "text-muted-foreground line-through")}>
              {REMINDER_LABELS[reminder.reminder_type]}
            </p>
            <p className="text-xs text-muted-foreground tnum">
              {formatDate(reminder.reminder_date)}
              {!reminder.completed && (
                <span className={cn("ml-1", overdue && "text-rose-600 dark:text-rose-400")}>· {overdue ? `overdue (${dueLabel})` : dueLabel}</span>
              )}
              {reminder.completed && " · completed"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {!reminder.completed && (
            <>
              <Button variant="ghost" size="iconSm" onClick={() => completeReminder(reminder.id)} aria-label="Complete follow-up">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="iconSm" onClick={() => setRescheduling((v) => !v)} aria-label="Reschedule follow-up">
                <CalendarDays className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => { deleteReminder(reminder.id); toast.success("Follow-up deleted") }} aria-label="Delete follow-up">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {rescheduling && (
        <div className="mt-2 flex items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8" />
          <Button
            size="sm"
            onClick={() => {
              updateReminder(reminder.id, { reminder_date: date })
              toast.success("Follow-up rescheduled")
              setRescheduling(false)
            }}
          >
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setDate(reminder.reminder_date); setRescheduling(false) }}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Small section heading                                               */
/* ------------------------------------------------------------------ */
function SectionHeading({ children, icon: Icon, action }: { children: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; action?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {children}
      </h3>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Application detail drawer / mobile sheet                            */
/* ------------------------------------------------------------------ */
export function ApplicationDetail({
  application,
  open,
  onOpenChange,
}: {
  application: Application | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const companyMap = useCompanyMap()
  const setStatus = useJobStore((s) => s.setStatus)
  const archiveApplication = useJobStore((s) => s.archiveApplication)
  const deleteApplication = useJobStore((s) => s.deleteApplication)
  const updateApplication = useJobStore((s) => s.updateApplication)
  const resolveNextAction = useNextActionResolver()

  const [editOpen, setEditOpen] = useState(false)
  const [followupOpen, setFollowupOpen] = useState(false)
  const [interviewOpen, setInterviewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [notesDraft, setNotesDraft] = useState("")

  const appId = application?.id ?? ""
  const events = useEventsFor(appId)
  const interviews = useInterviewsFor(appId)
  const reminders = useRemindersFor(appId)
  const panelRef = useRef<HTMLDivElement>(null)
  const interviewCountRef = useRef(interviews.length)

  // Sync notes draft + interview baseline when the target application changes.
  useEffect(() => {
    setNotesDraft(application?.notes ?? "")
    interviewCountRef.current = interviews.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id])

  // Suggest moving to "Interviewing" when an interview is added (PRD §21).
  useEffect(() => {
    if (!application) return
    if (interviews.length > interviewCountRef.current) {
      const st = application.status
      if (st === "wishlist" || st === "applied") {
        toast("Interview added", {
          description: "Move this application to Interviewing?",
          action: { label: "Move", onClick: () => setStatus(application.id, "interviewing") },
        })
      }
    }
    interviewCountRef.current = interviews.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviews.length])

  // Esc to close + body scroll lock + focus the panel on open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panelRef.current?.focus()
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onOpenChange])

  if (!application) return null
  const company = companyMap.get(application.company_id)
  const next: NextAction = resolveNextAction(application)
  const salary = [application.salary_min, application.salary_max].filter((n) => n != null) as number[]
  const salaryText =
    salary.length === 0
      ? null
      : `${salary[0]?.toLocaleString() ?? "—"}${salary[1] ? " – " + salary[1]?.toLocaleString() : ""} ${application.currency ?? ""}`.trim()
  const notesDirty = notesDraft.trim() !== (application.notes ?? "").trim()

  function archiveWithUndo() {
    const wasArchived = application!.archived
    archiveApplication(application!.id, !wasArchived)
    toast.success(wasArchived ? "Application restored" : "Application archived", {
      action: { label: "Undo", onClick: () => archiveApplication(application!.id, wasArchived) },
    })
  }

  // Primary action = most likely next step, derived from the next action.
  const primary =
    next.kind === "attend_interview" || next.kind === "prepare_interview"
      ? { label: "Add interview", onClick: () => setInterviewOpen(true), icon: CalendarDays }
      : next.kind === "apply"
        ? { label: "Mark as applied", onClick: () => setStatus(application.id, "applied"), icon: Check }
        : { label: "Schedule follow-up", onClick: () => setFollowupOpen(true), icon: CalendarPlus }

  const uc = urgencyClasses(next.urgency)
  const UrgencyIcon = uc.icon

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange(false)} aria-hidden="true" />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${application.job_title} at ${company?.name ?? "company"}`}
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-10 flex w-full flex-col bg-card shadow-overlay outline-none sm:max-w-xl sm:border-l sm:border-border"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 border-b border-border bg-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <CompanyLogo company={company} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold leading-tight tracking-tight">{application.job_title}</h2>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{company?.name ?? "Unknown company"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={application.status} />
                      <PriorityBadge priority={application.priority} />
                      {application.archived && (
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Archived</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground sm:h-9 sm:w-9"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Primary action bar */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={primary.onClick}>
                  <primary.icon className="h-3.5 w-3.5" /> {primary.label}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {STATUS_META[application.status].label}
                      <span className="ml-0.5 text-xs text-muted-foreground" aria-hidden="true">▾</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Change status</DropdownMenuLabel>
                    {STATUSES.map((s) => (
                      <DropdownMenuItem key={s} disabled={s === application.status} onClick={() => setStatus(application.id, s)}>
                        <span className={cn("h-2 w-2 rounded-full", STATUS_META[s].dot)} />
                        {STATUS_META[s].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="iconSm" aria-label="More actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFollowupOpen(true)}>
                      <CalendarPlus className="h-3.5 w-3.5" /> Schedule follow-up
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setInterviewOpen(true)}>
                      <CalendarDays className="h-3.5 w-3.5" /> Add interview
                    </DropdownMenuItem>
                    {application.job_url && (
                      <DropdownMenuItem asChild>
                        <a href={application.job_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> Open job link
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={archiveWithUndo}>
                      {application.archived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                      {application.archived ? "Restore" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-8 overflow-y-auto p-4 sm:p-5">
              {/* Next action — first body section */}
              <section>
                <SectionHeading icon={UrgencyIcon}>Next action</SectionHeading>
                {next.kind === "none" ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium">No next action</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {application.archived || application.status === "rejected" || application.status === "ghosted"
                        ? "This application is closed."
                        : "Schedule a follow-up to keep this application moving."}
                    </p>
                    {!(application.status === "rejected" || application.status === "ghosted") && (
                      <Button size="sm" className="mt-3" onClick={() => setFollowupOpen(true)}>
                        <CalendarPlus className="h-3.5 w-3.5" /> Schedule follow-up
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className={cn("rounded-lg border p-4", uc.wrap)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn("text-sm font-semibold", uc.label)}>
                          {next.urgency === "overdue" ? "Overdue: " : ""}{next.label}
                        </p>
                        {next.date && (
                          <p className="mt-0.5 text-xs text-muted-foreground tnum">
                            {formatDate(next.date)} · {dayLabel(daysUntil(next.date))}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={next.urgency === "normal" ? "outline" : "default"}
                        onClick={primary.onClick}
                      >
                        <primary.icon className="h-3.5 w-3.5" /> {primary.label}
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              {/* Activity timeline — visually dominant */}
              <section>
                <SectionHeading icon={History}>Activity timeline</SectionHeading>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                ) : (
                  <ol className="relative space-y-4 border-l border-border pl-5">
                    {events.map((e) => {
                      const Icon = EVENT_ICON[e.event_type] ?? History
                      return (
                        <li key={e.id} className="relative">
                          <span className="absolute -left-[26px] top-0 grid h-5 w-5 place-items-center rounded-full border border-border bg-card text-muted-foreground ring-2 ring-card">
                            <Icon className="h-3 w-3" />
                          </span>
                          <p className="text-sm font-medium leading-snug">{e.title}</p>
                          {e.description && <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(e.created_at)}</p>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </section>

              {/* Interviews */}
              <section>
                <SectionHeading
                  icon={CalendarDays}
                  action={
                    <Button variant="ghost" size="xs" onClick={() => setInterviewOpen(true)}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  }
                >
                  Interviews
                </SectionHeading>
                {interviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No interviews scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {interviews
                      .slice()
                      .sort((a, b) => (a.date < b.date ? 1 : -1))
                      .map((iv) => (
                        <InterviewRow key={iv.id} interview={iv} app={application} />
                      ))}
                  </div>
                )}
              </section>

              {/* Follow-ups */}
              <section>
                <SectionHeading
                  icon={CalendarPlus}
                  action={
                    <Button variant="ghost" size="xs" onClick={() => setFollowupOpen(true)}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  }
                >
                  Follow-ups
                </SectionHeading>
                {reminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {reminders
                      .slice()
                      .sort((a, b) => (a.reminder_date < b.reminder_date ? -1 : 1))
                      .map((r) => (
                        <ReminderRow key={r.id} reminder={r} />
                      ))}
                  </div>
                )}
              </section>

              {/* Job information */}
              <section>
                <SectionHeading>Job information</SectionHeading>
                <dl className="divide-y divide-border/60">
                  <DetailField label="Source">{application.source ? SOURCE_LABELS[application.source] : ""}</DetailField>
                  <DetailField label="Location">{application.location || ""}</DetailField>
                  <DetailField label="Work mode">{application.work_mode ? WORK_MODE_LABELS[application.work_mode] : ""}</DetailField>
                  <DetailField label="Job type">{application.job_type ? JOB_TYPE_LABELS[application.job_type] : ""}</DetailField>
                  <DetailField label="Priority">{PRIORITY_META[application.priority].label}</DetailField>
                  <DetailField label="Applied">{application.applied_date ? formatDate(application.applied_date) : ""}</DetailField>
                  <DetailField label="Deadline">{application.deadline ? formatDate(application.deadline) : ""}</DetailField>
                  <DetailField label="Salary">{salaryText || ""}</DetailField>
                  <DetailField label="Recruiter">{application.recruiter_name || ""}</DetailField>
                  <DetailField label="Contact">{application.recruiter_contact || ""}</DetailField>
                  <DetailField label="Resume">{application.resume_used || ""}</DetailField>
                  <DetailField label="Cover letter">{application.cover_letter_used || ""}</DetailField>
                  <DetailField label="Job link">
                    {application.job_url ? (
                      <a
                        href={application.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      ""
                    )}
                  </DetailField>
                </dl>
                {application.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {application.tags.map((t) => (
                      <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
              </section>

              {/* Notes */}
              <section>
                <SectionHeading icon={StickyNote}>Notes</SectionHeading>
                <Textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Anything worth remembering about this application…"
                  className="min-h-[96px]"
                  aria-label="Application notes"
                />
                {notesDirty && (
                  <div className="mt-2 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setNotesDraft(application.notes ?? "")}>
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        updateApplication(application.id, { notes: notesDraft })
                        toast.success("Notes saved")
                      }}
                    >
                      <Save className="h-3.5 w-3.5" /> Save notes
                    </Button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      <ApplicationFormModal open={editOpen} onOpenChange={setEditOpen} application={application} />
      <ScheduleFollowupModal open={followupOpen} onOpenChange={setFollowupOpen} applicationId={application.id} />
      <AddInterviewModal open={interviewOpen} onOpenChange={setInterviewOpen} applicationId={application.id} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete application?"
        description={
          <>
            This permanently deletes <strong>{application.job_title}</strong> at {company?.name}. Its timeline,
            interviews and follow-ups are removed too. This can’t be undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          deleteApplication(application.id)
          onOpenChange(false)
        }}
      />
    </>
  )
}
