import { useState } from "react"
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
} from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap, useEventsFor, useInterviewsFor, useRemindersFor } from "@/store/selectors"
import { STATUSES, type Application } from "@/types"
import { STATUS_META, SOURCE_LABELS, WORK_MODE_LABELS, JOB_TYPE_LABELS, PRIORITY_META } from "@/lib/constants"
import { formatDate, formatDateTime } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
} from "@/components/ui/dropdown"
import { CompanyLogo, StatusBadge, PriorityBadge, ConfirmDialog } from "@/components/shared"
import { ApplicationFormModal } from "./ApplicationFormModal"
import { ScheduleFollowupModal } from "@/features/followups/ScheduleFollowupModal"
import { AddInterviewModal } from "@/features/interviews/AddInterviewModal"
import { cn } from "@/lib/utils"

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (children == null || children === "" || children === "—") return null
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  )
}

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

  const [editOpen, setEditOpen] = useState(false)
  const [followupOpen, setFollowupOpen] = useState(false)
  const [interviewOpen, setInterviewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const appId = application?.id ?? ""
  const events = useEventsFor(appId)
  const interviews = useInterviewsFor(appId)
  const reminders = useRemindersFor(appId)

  if (!application) return null
  const company = companyMap.get(application.company_id)
  const salary = [application.salary_min, application.salary_max].filter((n) => n != null)
  const salaryText =
    salary.length === 0
      ? null
      : `${salary[0]?.toLocaleString() ?? "—"}${salary[1] ? " – " + salary[1]?.toLocaleString() : ""} ${application.currency ?? ""}`

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange(false)} aria-hidden="true" />
          <div className="fixed inset-y-0 right-0 z-10 flex w-full max-w-xl flex-col bg-card shadow-2xl sm:border-l sm:border-border">
            {/* Header */}
            <div className="border-b border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <CompanyLogo company={company} size="lg" />
                  <div>
                    <h2 className="text-lg font-semibold leading-tight tracking-tight">{application.job_title}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{company?.name ?? "Unknown company"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={application.status} />
                      <PriorityBadge priority={application.priority} />
                    </div>
                  </div>
                </div>
                <button
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {STATUS_META[application.status].label}
                      <span className="ml-1 text-xs text-muted-foreground">▾</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Change status</DropdownMenuLabel>
                    {STATUSES.map((s) => (
                      <DropdownMenuItem key={s} disabled={s === application.status} onClick={() => setStatus(application.id, s)}>
                        <span className={cn("h-2 w-2 rounded-full", STATUS_META[s].dot)} />
                        {STATUS_META[s].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => setFollowupOpen(true)}>
                  <CalendarPlus className="h-3.5 w-3.5" /> Follow-up
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInterviewOpen(true)}>
                  <CalendarDays className="h-3.5 w-3.5" /> Interview
                </Button>
                <Button variant="outline" size="iconSm" onClick={() => setEditOpen(true)} aria-label="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {application.job_url && (
                  <a href={application.job_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="iconSm" aria-label="Open job URL">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="iconSm" onClick={() => archiveApplication(application.id, !application.archived)} aria-label={application.archived ? "Restore" : "Archive"}>
                    {application.archived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setDeleteOpen(true)} aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {/* Meta */}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                <Row label="Applied">{application.applied_date ? formatDate(application.applied_date) : "—"}</Row>
                <Row label="Source">{application.source ? SOURCE_LABELS[application.source] : null}</Row>
                <Row label="Location">{application.location || null}</Row>
                <Row label="Work mode">{application.work_mode ? WORK_MODE_LABELS[application.work_mode] : null}</Row>
                <Row label="Job type">{application.job_type ? JOB_TYPE_LABELS[application.job_type] : null}</Row>
                <Row label="Priority">{application.priority ? PRIORITY_META[application.priority].label : null}</Row>
                <Row label="Salary">{salaryText}</Row>
                <Row label="Deadline">{application.deadline ? formatDate(application.deadline) : null}</Row>
                <Row label="Recruiter">
                  {application.recruiter_name ? (
                    <span>
                      {application.recruiter_name}
                      {application.recruiter_contact && (
                        <span className="block text-xs text-muted-foreground">{application.recruiter_contact}</span>
                      )}
                    </span>
                  ) : null}
                </Row>
              </dl>

              {application.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {application.tags.map((t) => (
                    <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}

              {/* Interviews */}
              {interviews.length > 0 && (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Interviews</h3>
                  <div className="space-y-2">
                    {interviews.map((iv) => (
                      <div key={iv.id} className="rounded-md border border-border bg-background p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{iv.stage || "Interview"}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(iv.date)}{iv.start_time ? ` • ${iv.start_time}` : ""}</span>
                        </div>
                        {iv.interviewer && <p className="mt-1 text-xs text-muted-foreground">{iv.interviewer}</p>}
                        {iv.notes && <p className="mt-1 text-sm text-muted-foreground">{iv.notes}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Reminders */}
              {reminders.length > 0 && (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Follow-ups</h3>
                  <div className="space-y-2">
                    {reminders.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", r.completed ? "bg-emerald-500" : "bg-amber-500")} />
                          <span className={r.completed ? "text-muted-foreground line-through" : ""}>{formatDate(r.reminder_date)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{r.completed ? "Completed" : "Pending"}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Notes */}
              {application.notes && (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Notes</h3>
                  <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">{application.notes}</p>
                </section>
              )}

              {/* Timeline */}
              <section>
                <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <History className="h-3.5 w-3.5" /> Timeline
                </h3>
                <div className="relative space-y-4 border-l border-border pl-4">
                  {events.map((e) => (
                    <div key={e.id} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-border ring-2 ring-card" />
                      <p className="text-sm font-medium">{e.title}</p>
                      {e.description && <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(e.created_at)}</p>
                    </div>
                  ))}
                  {events.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
                </div>
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
