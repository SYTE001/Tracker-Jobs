import { useMemo, useState } from "react"
import { BellRing, Plus, Check, Trash2 } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap } from "@/store/selectors"
import { isDatePast, isDateToday, formatDate } from "@/lib/dates"
import { REMINDER_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { EmptyState, PageHeader, CompanyLogo } from "@/components/shared"
import { ScheduleFollowupModal } from "./ScheduleFollowupModal"

export function FollowupsPage() {
  const reminders = useJobStore((s) => s.reminders)
  const applications = useJobStore((s) => s.applications)
  const companyMap = useCompanyMap()
  const completeReminder = useJobStore((s) => s.completeReminder)
  const deleteReminder = useJobStore((s) => s.deleteReminder)
  const updateReminder = useJobStore((s) => s.updateReminder)

  const [open, setOpen] = useState(false)
  const [pickApp, setPickApp] = useState("")

  const active = useMemo(
    () =>
      reminders
        .filter((r) => !r.completed)
        .sort((a, b) => a.reminder_date.localeCompare(b.reminder_date))
        .map((r) => ({
          reminder: r,
          overdue: isDatePast(r.reminder_date),
          today: isDateToday(r.reminder_date),
        })),
    [reminders],
  )
  const completed = useMemo(() => reminders.filter((r) => r.completed).sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")).slice(0, 5), [reminders])

  const groups = useMemo(() => ({
    overdue: active.filter((x) => x.overdue),
    today: active.filter((x) => x.today),
    upcoming: active.filter((x) => !x.overdue && !x.today),
  }), [active])

  const appPicks = applications.filter((a) => !a.archived)

  const Actions = ({ id }: { id: string }) => (
    <div className="flex items-center gap-1">
      <Button size="iconSm" variant="ghost" onClick={() => completeReminder(id)} aria-label="Complete"><Check className="h-4 w-4 text-emerald-600" /></Button>
      <Button size="iconSm" variant="ghost" className="text-destructive" onClick={() => deleteReminder(id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
    </div>
  )

  const renderGroup = (title: string, items: typeof active, emptyText: string, accent?: string) => (
    <section>
      <h3 className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${accent ?? "text-muted-foreground"}`}>{title}</h3>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-1.5">
          {items.map(({ reminder }) => {
            const app = applications.find((a) => a.id === reminder.application_id)
            return (
              <div key={reminder.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                <CompanyLogo company={app ? companyMap.get(app.company_id) : undefined} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{app?.job_title ?? "Application"}</p>
                  <p className="truncate text-xs text-muted-foreground">{REMINDER_LABELS[reminder.reminder_type]}</p>
                </div>
                <Input
                  type="date"
                  value={reminder.reminder_date}
                  onChange={(e) => updateReminder(reminder.id, { reminder_date: e.target.value })}
                  className="h-8 w-[150px] text-xs"
                  aria-label="Reschedule"
                />
                <span className="hidden w-20 text-right text-xs text-muted-foreground sm:block">{formatDate(reminder.reminder_date, "MMM d")}</span>
                <Actions id={reminder.id} />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description="Keep every application moving — nothing slips through."
        action={
          appPicks.length > 0 ? (
            <Button onClick={() => { setPickApp(appPicks[0]?.id ?? ""); setOpen(true) }}>
              <Plus className="h-4 w-4" />New follow-up
            </Button>
          ) : undefined
        }
      />

      {appPicks.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-accent/40 px-3 py-2">
          <label htmlFor="fp_pick" className="text-sm text-muted-foreground">Application:</label>
          <Select id="fp_pick" value={pickApp} onChange={(e) => setPickApp(e.target.value)}>
            {appPicks.map((a) => <option key={a.id} value={a.id}>{a.job_title} · {companyMap.get(a.company_id)?.name}</option>)}
          </Select>
        </div>
      )}

      {active.length === 0 ? (
        <EmptyState
          icon={<BellRing className="h-5 w-5" />}
          title="You're all caught up"
          description="No follow-ups due. Schedule one to stay on top of your applications."
          action={appPicks.length ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New follow-up</Button> : undefined}
        />
      ) : (
        <div className="space-y-6">
          {renderGroup(`Overdue (${groups.overdue.length})`, groups.overdue, "Nothing overdue.", "text-destructive")}
          {renderGroup(`Today (${groups.today.length})`, groups.today, "Nothing due today.", "text-amber-600 dark:text-amber-400")}
          {renderGroup(`Upcoming (${groups.upcoming.length})`, groups.upcoming, "No upcoming follow-ups.")}
        </div>
      )}

      {completed.length > 0 && (
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Completed</h3>
          <div className="space-y-1">
            {completed.map((r) => {
              const app = applications.find((a) => a.id === r.application_id)
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="line-through">{app?.job_title ?? "Application"}</span>
                  <span className="ml-auto text-xs">{REMINDER_LABELS[r.reminder_type] as string}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <ScheduleFollowupModal open={open} onOpenChange={setOpen} applicationId={pickApp} />
    </div>
  )
}
