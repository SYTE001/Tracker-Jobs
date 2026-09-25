import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Plus, Pencil, Trash2, ExternalLink, Building2, Search } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { companyStats } from "@/features/metrics/metrics"
import { formatDate, relativeTime } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { CompanyLogo, EmptyState, StatusBadge, PriorityBadge, ConfirmDialog, Section } from "@/components/shared"
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
  const updateCompany = useJobStore((s) => s.updateCompany)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [appQuery, setAppQuery] = useState("")
  const [notes, setNotes] = useState("")

  const company = companies.find((c) => c.id === id)

  // Keep the editable notes buffer in sync with the stored company.
  useEffect(() => {
    setNotes(company?.notes ?? "")
  }, [company?.id, company?.notes])

  const stats = useMemo(() => (company ? companyStats(applications, interviews, company.id) : null), [company, applications, interviews])
  const companyApps = useMemo(
    () =>
      applications
        .filter((a) => a.company_id === id)
        .filter((a) => !appQuery || a.job_title.toLowerCase().includes(appQuery.toLowerCase()))
        .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "")),
    [applications, id, appQuery],
  )
  const detailApp = detailId ? applications.find((a) => a.id === detailId) ?? null : null

  if (!company) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/companies")}><ArrowLeft className="h-4 w-4" />Back</Button>
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="Company not found" description="It may have been removed." action={<Link to="/companies"><Button variant="outline">Browse companies</Button></Link>} />
      </div>
    )
  }

  const notesDirty = notes !== (company.notes ?? "")

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
          <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setDelOpen(true)} aria-label="Delete company"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Applications", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Interviews", value: stats.interviews },
            { label: "Offers", value: stats.offers },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-[13px] font-medium text-muted-foreground">{k.label}</p>
              <p className="tnum mt-1 text-2xl font-semibold">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <Section
        title="Applications"
        description={`${companyApps.length} shown`}
        action={<Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add job</Button>}
      >
        {applications.some((a) => a.company_id === id) && (
          <div className="relative mb-3 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={appQuery} onChange={(e) => setAppQuery(e.target.value)} placeholder="Search applications…" className="pl-8" aria-label="Search applications" />
          </div>
        )}
        {companyApps.length === 0 ? (
          <EmptyState
            compact
            title={appQuery ? "No applications match" : "No applications yet"}
            description={appQuery ? "Try a different search." : "Add an application for this company to start tracking."}
            action={!appQuery ? <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add job</Button> : undefined}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <ul className="divide-y divide-border">
              {companyApps.map((app) => (
                <li key={app.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                    onClick={() => setDetailId(app.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{app.job_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.status === "wishlist" ? "Wishlist" : `Applied ${app.applied_date ? formatDate(app.applied_date) : "—"}`} · Updated {relativeTime(app.updated_at)}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                    <PriorityBadge priority={app.priority} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Notes" description="Context worth remembering about this company.">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this company…"
          rows={4}
          aria-label="Company notes"
        />
        <div className="mt-2 flex justify-end gap-2">
          {notesDirty && (
            <Button variant="ghost" size="sm" onClick={() => setNotes(company.notes ?? "")}>Reset</Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={!notesDirty}
            onClick={() => {
              updateCompany(company.id, { notes: notes.trim() || undefined })
              toast.success("Notes saved")
            }}
          >
            Save notes
          </Button>
        </div>
      </Section>

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
