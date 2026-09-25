import { useMemo, useState } from "react"
import { CalendarDays, Plus, MapPin, Link2 } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap } from "@/store/selectors"
import { formatDate, daysUntil, isDateUpcoming } from "@/lib/dates"
import { INTERVIEW_TYPE_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { CompanyLogo, EmptyState, PageHeader } from "@/components/shared"
import { AddInterviewModal } from "./AddInterviewModal"

export function InterviewsPage() {
  const interviews = useJobStore((s) => s.interviews)
  const applications = useJobStore((s) => s.applications)
  const companyMap = useCompanyMap()

  const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming")
  const [open, setOpen] = useState(false)
  const [pickApp, setPickApp] = useState("")

  const grouped = useMemo(() => {
    const sorted = [...interviews].sort((a, b) => a.date.localeCompare(b.date))
    return {
      upcoming: sorted.filter((iv) => isDateUpcoming(iv.date)),
      past: sorted.filter((iv) => !isDateUpcoming(iv.date)).reverse(),
      all: sorted,
    }
  }, [interviews])

  const list = grouped[tab]

  const appPicks = applications.filter((a) => !a.archived && (a.status === "interviewing" || a.status === "applied" || a.status === "offer"))

  return (
    <div className="space-y-4">
      <PageHeader
        title="Interviews"
        description="Every scheduled and past interview, linked to the application."
        action={
          appPicks.length > 0 ? (
            <Button
              onClick={() => {
                setPickApp(appPicks[0]?.id ?? "")
                setOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />Add interview
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {(["upcoming", "past", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {appPicks.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-accent/40 px-3 py-2">
          <label htmlFor="iv_pick" className="text-sm text-muted-foreground">Application:</label>
          <Select id="iv_pick" value={pickApp} onChange={(e) => setPickApp(e.target.value)}>
            {appPicks.map((a) => <option key={a.id} value={a.id}>{a.job_title} · {companyMap.get(a.company_id)?.name}</option>)}
          </Select>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title={tab === "upcoming" ? "No upcoming interviews" : tab === "past" ? "No past interviews" : "No interviews yet"}
          description="Add an interview to keep track of every stage."
          action={appPicks.length > 0 ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add interview</Button> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {list.map((iv) => {
            const app = applications.find((a) => a.id === iv.application_id)
            const company = app ? companyMap.get(app.company_id) : undefined
            const d = daysUntil(iv.date)
            return (
              <div key={iv.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5">
                <CompanyLogo company={company} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{app?.job_title ?? "Application"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {company?.name} · {iv.stage || "Interview"} · {INTERVIEW_TYPE_LABELS[iv.type]}
                  </p>
                  {(iv.interviewer || iv.meeting_url || iv.location) && (
                    <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
                      {iv.interviewer && <span>{iv.interviewer}</span>}
                      {iv.location && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{iv.location}</span>}
                      {iv.meeting_url && <Link2 className="h-3 w-3" />}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatDate(iv.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {iv.start_time ?? ""} {d !== null && d >= 0 && <span className="text-violet-600 dark:text-violet-400">· {d === 0 ? "Today" : d === 1 ? "Tomorrow" : `in ${d}d`}</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddInterviewModal open={open} onOpenChange={setOpen} applicationId={pickApp} />
    </div>
  )
}
