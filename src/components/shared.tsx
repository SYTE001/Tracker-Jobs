import * as React from "react"
import { AlertTriangle, Loader2, Plus } from "lucide-react"
import type { Company, JobStatus, Priority } from "@/types"
import { STATUS_META, PRIORITY_META, SOURCE_LABELS } from "@/lib/constants"
import { cn, initials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

/* ----------------------------- Page header ----------------------------- */
export function PageHeader({
  title,
  description,
  action,
  meta,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  meta?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {meta}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

/* ----------------------------- Company logo ----------------------------- */
const LOGO_TINTS = [
  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
]

export function CompanyLogo({
  company,
  size = "md",
  className,
}: {
  company?: Company
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const [failed, setFailed] = React.useState(false)
  const dims = size === "sm" ? "h-6 w-6 text-[10px]" : size === "lg" ? "h-11 w-11 text-sm" : "h-8 w-8 text-xs"
  let tint = 0
  if (company?.name) {
    let h = 0
    for (const ch of company.name) h = (h * 31 + ch.charCodeAt(0)) % 100000
    tint = h % LOGO_TINTS.length
  }
  const hasLogo = company?.logo && !failed
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md font-semibold",
        dims,
        hasLogo ? "bg-background" : LOGO_TINTS[tint],
        className,
      )}
      aria-hidden="true"
    >
      {hasLogo ? (
        <img
          src={company!.logo!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        initials(company?.name)
      )}
    </span>
  )
}

/* ----------------------------- Badges ----------------------------- */
export function StatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        meta.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  )
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const meta = PRIORITY_META[priority]
  return (
    <span className={cn("inline-flex rounded border px-1.5 py-0.5 text-[11px] font-medium", meta.badge, className)}>
      {meta.label}
    </span>
  )
}

export function SourceLabel({ source }: { source?: string }) {
  const label = source ? SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] ?? source : "—"
  return <span className="capitalize">{label}</span>
}

/* ----------------------------- Empty state ----------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
  compact,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 text-center",
        compact ? "px-4 py-8" : "px-6 py-16",
      )}
    >
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

/* ----------------------------- Confirm dialog ----------------------------- */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  destructive,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description: React.ReactNode
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {destructive && <AlertTriangle className="h-4 w-4 text-destructive" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Action button used inside empty states — "Add your first job". */
export function AddButton({ children, onClick, asDigit }: { children: React.ReactNode; onClick: () => void; asDigit?: boolean }) {
  return (
    <Button onClick={onClick} data-add-jobs={asDigit ? "" : undefined}>
      <Plus className="h-4 w-4" />
      {children}
    </Button>
  )
}
