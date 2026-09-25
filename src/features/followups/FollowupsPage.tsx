import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BellRing, Plus, Check, Trash2, CalendarClock, ExternalLink, ChevronDown } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap, useActiveReminders } from "@/store/selectors"
import { isDateToday, daysUntil, formatDate } from "@/lib/dates"
import { REMINDER_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { EmptyState, PageHeader, CompanyLogo, Section, ConfirmDialog } from "@/components/shared"
import { ScheduleFollowupModal } from "./ScheduleFollowupModal"

type ActiveReminder = ReturnType<typeof useActiveReminders>[number]

export function FollowupsPage() {
  const reminders = useJobStore((s) => s.reminders)
  const applications = useJobStore((s) => s.applications)
  const companyMap = useCompanyMap()
  const completeReminder = useJobStore((s) => s.completeReminder)
  const deleteReminder = useJobStore((s) => s.deleteReminder)
  const updateReminder = useJobStore((s) => s.updateReminder)
  const navigate = useNavigate()

  const active = useActiveReminders()

  const [open, setOpen] = useState(false)
  const [pickApp, setPickApp] = useState("")
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const groups = useMemo(() => {
    const overdue: ActiveReminder[] = []
    const today: ActiveReminder[] = []
    const tomorrow: ActiveReminder[] = []
    const thisWeek: ActiveReminder[] = []
    const later: ActiveReminder[] = []
    for (const item of active) {
      if (item.overdue) overdue.push(item)
      else if (isDateToday(item.reminder.reminder_date)) today.push(item)
      else {
        const d = daysUntil(item.reminder.reminder_date) ?? 0
        if (d === 1) tomorrow.push(item)
        else if (d <= 7) thisWeek.push(item)
        else later.push(item)
      }
    }
    return { overdue, today, tomorrow, thisWeek, later }
  }, [active])

  const completed = useMemo(
    () =>
      reminders
        .filter((r) => r.completed)
        .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")),
    [reminders],
  )

  const appPicks = applications.filter((a) => !a.archived)

  const appFor = (id: string) => applications.find((a) => a.id === id)

  const Row = ({ item, tone }: { item: ActiveReminder; tone: "overdue" | "today" | "normal" }) => {
    const { reminder } = item
    const app = appFor(reminder.application_id)
    const company = app ? companyMap.get(app.company_id) : undefined
    const d = daysUntil(reminder.reminder_date)
    const dueLabel =
      tone === "overdue"
        ? `${Math.abs(d ?? 0)}d overdue`
        : tone === "today"
          ? "Today"
          : d === 1
            ? "Tomorrow"
            : `in ${d}d`
    const isRescheduling = rescheduleId === reminder.id

    return (
      <div className="group rounded-md border border-transparent transition-colors hover:bg-accent/60">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <CompanyLogo company={company} size="sm" />
          <button
            type="button"
            onClick={() => app && navigate(`/applications/${app.id}`)}
            className="min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Open ${app?.job_title ?? "application"}`}
          >
            <p className="truncate text-sm font-medium">{app?.job_title ?? "Application"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {company?.name ? `${company.name} · ` : ""}
              {REMINDER_LABELS[reminder.reminder_type]}
            </p>
          </button>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="tnum text-xs text-muted-foreground">{formatDate(reminder.reminder_date, "MMM d")}</span>
            <span
              className={
                "tnum w-[76px] text-right text-xs font-medium " +
                (tone === "overdue"
                  ? "text-destructive"
                  : tone === "today"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground")
              }
            >
              {dueLabel}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              size="iconSm"
              variant="ghost"
              onClick={() => setRescheduleId(isRescheduling ? null : reminder.id)}
              aria-label="Reschedule"
              aria-expanded={isRescheduling}
              className={isRescheduling ? "bg-accent text-foreground" : ""}
            >
              <CalendarClock className="h-4 w-4" />
            </Button>
            {app && (
              <Button
                size="iconSm"
                variant="ghost"
                onClick={() => navigate(`/applications/${app.id}`)}
                aria-label="Open application"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="iconSm"
              variant="ghost"
              onClick={() => completeReminder(reminder.id)}
              aria-label="Mark complete"
            >
              <Check className="h-4 w-4 text-emerald-600" />
            </Button>
            <Button
              size="iconSm"
              variant="ghost"
              className="text-destructive"
              onClick={() => setConfirmDelete(reminder.id)}
              aria-label="Delete follow-up"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isRescheduling && (
          <div className="flex items-center gap-2 border-t border-border/60 px-2.5 py-2">
            <label htmlFor={`resched_${reminder.id}`} className="text-xs text-muted-foreground">
              New date
            </label>
            <Input
              id={`resched_${reminder.id}`}
              type="date"
              value={reminder.reminder_date}
              onChange={(e) => {
                updateReminder(reminder.id, { reminder_date: e.target.value })
                setRescheduleId(null)
              }}
              className="h-8 w-[160px] text-xs"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={() => setRescheduleId(null)}>
              Done
            </Button>
          </div>
        )}
      </div>
    )
  }

  const RowGroup = ({
    title,
    items,
    tone = "normal",
    accent,
  }: {
    title: string
    items: ActiveReminder[]
    tone?: "overdue" | "today" | "normal"
    accent?: string
  }) => {
    if (items.length === 0) return null
    return (
      <Section
        title={
          <span className={accent}>
            {title} <span className="tnum text-muted-foreground">({items.length})</span>
          </span>
        }
        bodyClassName="space-y-0.5"
      >
        {items.map((item) => (
          <Row key={item.reminder.id} item={item} tone={tone} />
        ))}
      </Section>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description="Your task queue — what's overdue and due today, first."
        action={
          appPicks.length > 0 ? (
            <Button
              onClick={() => {
                setPickApp((p) => p || appPicks[0]?.id || "")
                setOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              New follow-up
            </Button>
          ) : undefined
        }
      />

      {appPicks.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <label htmlFor="fp_pick" className="shrink-0 text-sm text-muted-foreground">
            Schedule for
          </label>
          <Select id="fp_pick" value={pickApp} onChange={(e) => setPickApp(e.target.value)} className="min-w-0">
            <option value="">Select an application…</option>
            {appPicks.map((a) => (
              <option key={a.id} value={a.id}>
                {a.job_title} · {companyMap.get(a.company_id)?.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {active.length === 0 ? (
        <EmptyState
          icon={<BellRing className="h-5 w-5" />}
          title="You're all caught up."
          description="No follow-ups due. Schedule one to keep an application moving, or review your applications."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              {appPicks.length > 0 && (
                <Button
                  onClick={() => {
                    setPickApp((p) => p || appPicks[0]?.id || "")
                    setOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Schedule a follow-up
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/applications")}>
                Go to applications
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          <RowGroup
            title="Overdue"
            items={groups.overdue}
            tone="overdue"
            accent="text-destructive"
          />
          <RowGroup
            title="Today"
            items={groups.today}
            tone="today"
            accent="text-amber-600 dark:text-amber-400"
          />
          {(groups.tomorrow.length > 0 || groups.thisWeek.length > 0 || groups.later.length > 0) && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold tracking-tight">Upcoming</h2>
              <RowGroup title="Tomorrow" items={groups.tomorrow} />
              <RowGroup title="This week" items={groups.thisWeek} />
              <RowGroup title="Later" items={groups.later} />
            </div>
          )}
        </div>
      )}

      {completed.length > 0 && (
        <section className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="flex w-full items-center gap-2 rounded-sm text-left text-sm font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={showCompleted}
          >
            <ChevronDown
              className={"h-4 w-4 text-muted-foreground transition-transform " + (showCompleted ? "" : "-rotate-90")}
            />
            Completed
            <span className="tnum font-normal text-muted-foreground">({completed.length})</span>
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-0.5">
              {completed.map((r) => {
                const app = appFor(r.application_id)
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="line-through">{app?.job_title ?? "Application"}</span>
                      <span className="ml-1.5 text-xs">· {REMINDER_LABELS[r.reminder_type]}</span>
                    </span>
                    {r.completed_at && (
                      <span className="tnum shrink-0 text-xs">Completed {formatDate(r.completed_at, "MMM d")}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      <ScheduleFollowupModal open={open} onOpenChange={setOpen} applicationId={pickApp} />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete follow-up?"
        description="This removes the reminder. This action cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDelete) deleteReminder(confirmDelete)
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}
