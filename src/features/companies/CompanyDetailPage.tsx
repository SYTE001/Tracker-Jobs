import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Plus, Pencil, Trash2, ExternalLink, Building2 } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { companyStats } from "@/features/metrics/metrics"
import { formatDate, relativeTime } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import { CompanyLogo, EmptyState, StatusBadge, PriorityBadge, ConfirmDialog } from "@/components/shared"
import { ApplicationFormModal } from "@/features/applications/ApplicationFormModal"
import { ApplicationDetail } from "@/features/applications/ApplicationDetail"
import { AddCompanyModal } from "./AddCompanyModal"
import { toast } from "sonner"

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const companies = useJobStore((s) => s.companies)
  const applications = useJobStore((s) => s.applications)
  const interviews = useJobStore((s) => s.interviews)
  const deleteCompany = useJobStore((s) => s.deleteCompany)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const company = companies.find((c) => c.id === id)
  const stats = useMemo(() => (company ? companyStats(applications, interviews, company.id) : null), [company, applications, interviews])
  const companyApps = useMemo(() => applications.filter((a) => a.company_id === id).sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "")), [applications, id])
  const detailApp = detailId ? applications.find((a) => a.id === detailId) ?? null : null

  if (!company) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/companies")}><ArrowLeft className="h-4 w-4" />Back</Button>
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="Company not found" description="It may have been removed." action={<Link to="/companies"><Button variant="outline">Browse companies</Button></Link>} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/companies")}><ArrowLeft className="h-4 w-4" />Companies</Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <CompanyLogo company={company} size="lg" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{company.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[company.industry, company.location].filter(Boolean).join(" · ") || "No details"}
            </p>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                {company.website.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
          <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setDelOpen(true)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {company.notes && <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">{company.notes}</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Applications", value: stats.total, cls: "" },
            { label: "Active", value: stats.active, cls: "text-blue-600 dark:text-blue-400" },
            { label: "Interviews", value: stats.interviews, cls: "text-violet-600 dark:text-violet-400" },
            { label: "Offers", value: stats.offers, cls: "text-emerald-600 dark:text-emerald-400" },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-[13px] font-medium text-muted-foreground">{k.label}</p>
              <p className={`mt-1 text-2xl font-semibold tabular-nums ${k.cls}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">All applications</h2>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add job</Button>
        </div>
        {companyApps.length === 0 ? (
          <EmptyState
            compact
            title="No applications yet"
            description="Add an application for this company to start tracking."
            action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add job</Button>}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <ul className="divide-y divide-border">
              {companyApps.map((app) => (
                <li key={app.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-accent/40" onClick={() => setDetailId(app.id)}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.job_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {app.status === "wishlist" ? "Wishlist" : `Applied ${app.applied_date ? formatDate(app.applied_date) : "—"}`} · Updated {relativeTime(app.updated_at)}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                  <PriorityBadge priority={app.priority} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <ApplicationFormModal open={addOpen} onOpenChange={setAddOpen} defaultStatus="applied" />
      <AddCompanyModal open={editOpen} onOpenChange={setEditOpen} company={company} />
      <ApplicationDetail application={detailApp} open={Boolean(detailApp)} onOpenChange={(o) => !o && setDetailId(null)} />
      <ConfirmDialog
        open={delOpen}
        onOpenChange={setDelOpen}
        title="Delete company?"
        description={
          stats && stats.total > 0
            ? `${company.name} has ${stats.total} application${stats.total === 1 ? "" : "s"}. Delete the applications first, or keep the company.`
            : `Remove ${company.name} from your companies.`
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          const ok = deleteCompany(company.id)
          if (ok) navigate("/companies")
          else toast.error("Couldn’t delete: applications reference this company.")
        }}
      />
    </div>
  )
}
