import { Draggable } from "@hello-pangea/dnd"
import { MoreHorizontal, Calendar, CalendarClock, MapPin, ExternalLink, Banknote } from "lucide-react"
import type { Application, Company } from "@/types"
import { PRIORITY_META } from "@/lib/constants"
import { isDatePast, formatDate } from "@/lib/dates"
import { CompanyLogo, PriorityBadge } from "@/components/shared"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown"
import { cn } from "@/lib/utils"

export interface CardMeta {
  company?: Company
  nextFollowup?: string | null
  hasInterview?: boolean
}

export function KanbanCard({
  application,
  company,
  meta,
  index,
  compact,
  onOpen,
  onEdit,
  onFollowup,
  onArchive,
}: {
  application: Application
  company?: Company
  meta?: CardMeta
  index: number
  compact: boolean
  onOpen: () => void
  onEdit: () => void
  onFollowup: () => void
  onArchive: () => void
}) {
  const overdue = meta?.nextFollowup ? isDatePast(meta.nextFollowup) : false
  const salary =
    application.salary_min != null || application.salary_max != null
      ? `${application.salary_min?.toLocaleString() ?? "…"}${application.salary_max ? "–" + application.salary_max.toLocaleString() : ""} ${application.currency ?? ""}`
      : null

  return (
    <Draggable draggableId={application.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onOpen}
          className={cn(
            "group rounded-md border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
            snapshot.isDragging && "rotate-1 shadow-lg ring-1 ring-ring",
            compact ? "space-y-1.5" : "space-y-2.5",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <CompanyLogo company={company} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-tight">{application.job_title}</p>
                <p className="truncate text-xs text-muted-foreground">{company?.name ?? "Unknown"}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-md p-1 text-muted-foreground opacity-100 hover:bg-accent hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Card actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen() }}>Open details</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit() }}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFollowup() }}>Schedule follow-up</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive() }}>
                  {application.archived ? "Restore" : "Archive"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {!compact && (application.notes || salary) && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{application.notes || salary}</p>
          )}

          {application.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {application.tags.slice(0, compact ? 2 : 4).map((t) => (
                <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2.5">
              {meta?.hasInterview && (
                <span className="inline-flex items-center gap-0.5 text-violet-600 dark:text-violet-400">
                  <CalendarClock className="h-3.5 w-3.5" />
                </span>
              )}
              {meta?.nextFollowup && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5",
                    overdue ? "font-medium text-destructive" : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(meta.nextFollowup, "MMM d")}
                </span>
              )}
              {!meta?.nextFollowup && !meta?.hasInterview && application.location && (
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="h-3.5 w-3.5" /> {application.location}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {salary && !compact && (
                <span className="inline-flex items-center gap-0.5"><Banknote className="h-3.5 w-3.5" /></span>
              )}
              <PriorityBadge priority={application.priority} />
              {application.job_url && (
                <a href={application.job_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

export { PRIORITY_META }
