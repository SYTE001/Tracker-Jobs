import { Draggable } from "@hello-pangea/dnd"
import { MoreHorizontal, CalendarClock, Calendar, ExternalLink, Check } from "lucide-react"
import type { Application, Company, JobStatus } from "@/types"
import { STATUSES } from "@/types"
import { PRIORITY_META, STATUS_META } from "@/lib/constants"
import type { NextAction, Urgency } from "@/lib/nextAction"
import { isDatePast, formatDate, relativeTime } from "@/lib/dates"
import { CompanyLogo, PriorityBadge } from "@/components/shared"
import { Select } from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown"
import { cn } from "@/lib/utils"

export interface CardMeta {
  company?: Company
  nextFollowup?: string | null
  hasInterview?: boolean
}

/** Semantic tone per next-action urgency. Color is reserved for urgency only. */
const URGENCY: Record<Urgency, { text: string; dot: string }> = {
  overdue: { text: "text-destructive", dot: "bg-destructive" },
  today: { text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  soon: { text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  normal: { text: "text-muted-foreground", dot: "bg-muted-foreground/50" },
  none: { text: "text-muted-foreground", dot: "bg-muted-foreground/30" },
}

export function KanbanCard({
  application,
  company,
  meta,
  nextAction,
  index,
  compact,
  onOpen,
  onEdit,
  onFollowup,
  onArchive,
  onSetStatus,
}: {
  application: Application
  company?: Company
  meta?: CardMeta
  nextAction: NextAction
  index: number
  compact: boolean
  onOpen: () => void
  onEdit: () => void
  onFollowup: () => void
  onArchive: () => void
  onSetStatus: (status: JobStatus) => void
}) {
  const overdue = meta?.nextFollowup ? isDatePast(meta.nextFollowup) : false
  const salary =
    application.salary_min != null || application.salary_max != null
      ? `${application.salary_min?.toLocaleString() ?? "…"}${application.salary_max ? "–" + application.salary_max.toLocaleString() : ""} ${application.currency ?? ""}`.trim()
      : null
  const lastActivity = application.last_activity_at || application.updated_at
  const urgency = URGENCY[nextAction.urgency]
  const showAction = nextAction.urgency !== "none"

  return (
    <Draggable draggableId={application.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onOpen}
          aria-label={`${application.job_title} at ${company?.name ?? "Unknown"}`}
          className={cn(
            "group cursor-pointer rounded-md border border-border bg-card outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
            snapshot.isDragging && "shadow-drag rotate-[0.5deg]",
            compact ? "p-2.5" : "p-3",
          )}
        >
          {/* TOP — identity */}
          <div className="flex items-start gap-2">
            <CompanyLogo company={company} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-tight">{application.job_title}</p>
              <p className="truncate text-xs text-muted-foreground">{company?.name ?? "Unknown"}</p>
            </div>
          </div>

          {/* MIDDLE — one important line (next action) + optional salary/tags */}
          {showAction && (
            <div className={cn("flex items-center gap-1.5 text-xs", compact ? "mt-1.5" : "mt-2", urgency.text)}>
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", urgency.dot)} aria-hidden="true" />
              <span className="truncate font-medium">
                {nextAction.label}
                {nextAction.date && (
                  <span className="font-normal opacity-80"> · {formatDate(nextAction.date, "MMM d")}</span>
                )}
              </span>
            </div>
          )}

          {!compact && salary && (
            <p className="mt-1 truncate text-[11px] tnum text-muted-foreground">{salary}</p>
          )}

          {!compact && (application.tags?.length ?? 0) > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {application.tags.slice(0, 2).map((t) => (
                <span key={t} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}

          {/* BOTTOM — signals + priority + overflow */}
          <div className={cn("flex items-center justify-between gap-2 border-t border-border text-[11px] text-muted-foreground", compact ? "mt-2 pt-2" : "mt-2.5 pt-2.5")}>
            <div className="flex min-w-0 items-center gap-2">
              {meta?.hasInterview && (
                <span className="inline-flex items-center gap-0.5 text-muted-foreground" title="Interview scheduled">
                  <CalendarClock className="h-3.5 w-3.5" />
                </span>
              )}
              {meta?.nextFollowup ? (
                <span
                  className={cn("inline-flex items-center gap-0.5", overdue ? "font-medium text-destructive" : "text-muted-foreground")}
                  title={overdue ? "Follow-up overdue" : "Next follow-up"}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(meta.nextFollowup, "MMM d")}
                </span>
              ) : (
                lastActivity && <span className="truncate">Updated {relativeTime(lastActivity)}</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <PriorityBadge priority={application.priority} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Actions for ${application.job_title}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen() }}>Open details</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit() }}>Quick edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFollowup() }}>Schedule follow-up</DropdownMenuItem>
                  {application.job_url && (
                    <DropdownMenuItem asChild>
                      <a
                        href={application.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between"
                      >
                        Open job URL
                        <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Move to</DropdownMenuLabel>
                  {STATUSES.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={s === application.status}
                      onClick={(e) => { e.stopPropagation(); onSetStatus(s) }}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[s].dot)} aria-hidden="true" />
                      <span className="flex-1">{STATUS_META[s].label}</span>
                      {s === application.status && <Check className="h-3.5 w-3.5 opacity-70" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive() }}>
                    {application.archived ? "Restore" : "Archive"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile status fallback — drag is not required on small screens (§8.3) */}
          <div className="mt-2 md:hidden">
            <Select
              value={application.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { e.stopPropagation(); onSetStatus(e.target.value as JobStatus) }}
              className="h-9 text-xs"
              aria-label={`Change status for ${application.job_title}`}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </Select>
          </div>
        </div>
      )}
    </Draggable>
  )
}

export { PRIORITY_META }
