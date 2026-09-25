import * as React from "react"
import { AlertTriangle, Loader2, Plus, X } from "lucide-react"
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
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {meta}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

/* ----------------------------- Company logo ----------------------------- */
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
  const hasLogo = company?.logo && !failed
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 font-semibold tracking-tight",
        dims,
        hasLogo ? "bg-background" : "bg-muted text-muted-foreground",
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

/* ----------------------------- Section ----------------------------- */
/** Level-1 grouping. A titled region separated by rhythm, not a card. */
export function Section({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn("min-w-0", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

/* ----------------------------- Metric summary ----------------------------- */
/** Inline dot-separated summary, e.g. "18 applications · 4 active · 2 interviews". */
export function MetricSummary({
  items,
  className,
}: {
  items: { value: React.ReactNode; label: string; onClick?: () => void; tone?: "default" | "accent" }[]
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm", className)}>
      {items.map((it, i) => {
        const content = (
          <>
            <span className={cn("tnum font-semibold", it.tone === "accent" && "text-foreground")}>{it.value}</span>{" "}
            <span className="text-muted-foreground">{it.label}</span>
          </>
        )
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-muted-foreground/50" aria-hidden="true">·</span>}
            {it.onClick ? (
              <button
                type="button"
                onClick={it.onClick}
                className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {content}
              </button>
            ) : (
              <span>{content}</span>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ----------------------------- Skeleton ----------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} aria-hidden="true" />
}

/* ----------------------------- Error state ----------------------------- */
export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ----------------------------- Filter chip ----------------------------- */
/** Active filter chip with a remove affordance. */
export function FilterChip({ label, value, onRemove }: { label: string; value: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 py-1 pl-2 pr-1 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="ml-0.5 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

/* ----------------------------- Detail key/value ----------------------------- */
export function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === "") return null
  return (
    <div className="grid grid-cols-[minmax(96px,120px)_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium">{children}</dd>
    </div>
  )
}

/* ----------------------------- Mobile action bar ----------------------------- */
/** Sticky bottom action bar for mobile forms/detail. */
export function MobileActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 left-0 right-0 z-10 flex items-center gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {children}
    </div>
  )
}
