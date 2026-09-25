import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Bookmark, ExternalLink, Pencil, Trash2, ArrowRightCircle, Search, Check } from "lucide-react"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap } from "@/store/selectors"
import { type SavedJob } from "@/types"
import { SOURCES } from "@/types"
import { SOURCE_LABELS } from "@/lib/constants"
import { formatDate, isDatePast } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { CompanyLogo, EmptyState, PriorityBadge, PageHeader, ConfirmDialog } from "@/components/shared"
import { AddSavedJobModal } from "./AddSavedJobModal"

/** A saved job is considered converted once it links to a live application. */
function isConverted(job: SavedJob): boolean {
  return job.status === "applied" || Boolean(job.application_id)
}

function salaryLabel(job: SavedJob): string | null {
  if (job.salary_min == null && job.salary_max == null) return null
  const min = job.salary_min?.toLocaleString() ?? "…"
  const max = job.salary_max?.toLocaleString() ?? "…"
  return `${min}–${max} ${job.currency ?? ""}`.trim()
}

export function SavedPage() {
  const navigate = useNavigate()
  const savedJobs = useJobStore((s) => s.saved_jobs)
  const companyMap = useCompanyMap()
  const convertSavedJob = useJobStore((s) => s.convertSavedJob)
  const deleteSavedJob = useJobStore((s) => s.deleteSavedJob)

  const [query, setQuery] = useState("")
  const [source, setSource] = useState("")
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<SavedJob | null>(null)
  const [del, setDel] = useState<SavedJob | null>(null)

  const rows = useMemo(() => {
    let list = savedJobs.filter((s) => s.status !== "archived")
    if (source) list = list.filter((s) => s.source === source)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((s) => {
        const company = companyMap.get(s.company_id)?.name ?? ""
        return s.job_title.toLowerCase().includes(q) || company.toLowerCase().includes(q) || (s.notes ?? "").toLowerCase().includes(q)
      })
    }
    return list.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
  }, [savedJobs, source, query, companyMap])

  const handleConvert = (job: SavedJob) => {
    if (isConverted(job)) {
      // Already converted — jump straight to the existing application.
      const appId = convertSavedJob(job.id)
      if (appId) navigate(`/applications/${appId}`)
      return
    }
    const companyName = companyMap.get(job.company_id)?.name ?? "the company"
    const appId = convertSavedJob(job.id)
    if (!appId) {
      toast.error("Couldn't convert this saved job.")
      return
    }
    toast.success("Converted to application", {
      description: `${job.job_title} at ${companyName} was added to your applications with a creation event. The saved job now links to it.`,
      action: { label: "Open details", onClick: () => navigate(`/applications/${appId}`) },
    })
  }

  if (savedJobs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Saved Jobs" description="Opportunities you've bookmarked before applying." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Save a job</Button>} />
        <EmptyState icon={<Bookmark className="h-5 w-5" />} title="Save opportunities here before applying." description="Keep promising roles on your radar, then convert them into applications in one click." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Save a job</Button>} />
        <AddSavedJobModal open={open} onOpenChange={setOpen} />
      </div>
    )
  }

  // Prefer a compact table on desktop when there are many saved jobs; keep the
  // roomier card view for small sets. Mobile always uses compact cards.
  const useTable = rows.length > 4

  return (
    <div className="space-y-4">
      <PageHeader title="Saved Jobs" description={`${rows.length} saved ${rows.length === 1 ? "job" : "jobs"}`} action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Save a job</Button>} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search saved jobs…" className="pl-8" aria-label="Search saved jobs" />
        </div>
        <Select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source">
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState compact title="No saved jobs match" description="Try a different search or source." />
      ) : (
        <>
          {/* Desktop table (many jobs) */}
          {useTable && (
            <div className="hidden overflow-hidden rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Job</th>
                    <th className="px-3 py-2 font-medium">Source</th>
                    <th className="px-3 py-2 font-medium">Salary</th>
                    <th className="px-3 py-2 font-medium">Deadline</th>
                    <th className="px-3 py-2 font-medium">Priority</th>
                    <th className="px-3 py-2 font-medium">Notes</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((job) => {
                    const company = companyMap.get(job.company_id)
                    const converted = isConverted(job)
                    const salary = salaryLabel(job)
                    const overdue = job.deadline ? isDatePast(job.deadline) : false
                    return (
                      <tr key={job.id} className="align-middle transition-colors hover:bg-accent/40">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <CompanyLogo company={company} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{job.job_title}</p>
                              <p className="truncate text-xs text-muted-foreground">{company?.name ?? "Unknown"}</p>
                            </div>
                            {converted && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                <Check className="h-2.5 w-2.5" />Converted
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{job.source ? SOURCE_LABELS[job.source] : "—"}</td>
                        <td className="tnum px-3 py-2.5 text-muted-foreground">{salary ?? "—"}</td>
                        <td className={cn("tnum px-3 py-2.5", overdue ? "text-destructive" : "text-muted-foreground")}>{job.deadline ? formatDate(job.deadline) : "—"}</td>
                        <td className="px-3 py-2.5"><PriorityBadge priority={job.priority} /></td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          <span className="line-clamp-1 max-w-[200px]">{job.notes || "—"}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant={converted ? "outline" : "default"}
                              onClick={() => handleConvert(job)}
                              title={converted ? "Open the linked application" : "Convert to application"}
                            >
                              <ArrowRightCircle className="h-3.5 w-3.5" />{converted ? "Open" : "Convert"}
                            </Button>
                            {job.url && (
                              <a href={job.url} target="_blank" rel="noopener noreferrer">
                                <Button size="iconSm" variant="ghost" aria-label="Open job URL"><ExternalLink className="h-3.5 w-3.5" /></Button>
                              </a>
                            )}
                            <Button size="iconSm" variant="ghost" onClick={() => setEdit(job)} aria-label="Edit saved job"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="iconSm" variant="ghost" className="text-destructive" onClick={() => setDel(job)} aria-label="Delete saved job"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Cards: always on mobile; on desktop only for small sets. */}
          <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", useTable && "md:hidden")}>
            {rows.map((job) => {
              const company = companyMap.get(job.company_id)
              const converted = isConverted(job)
              const salary = salaryLabel(job)
              const overdue = job.deadline ? isDatePast(job.deadline) : false
              return (
                <div key={job.id} className="flex flex-col rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-2.5">
                    <CompanyLogo company={company} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{job.job_title}</p>
                      <p className="truncate text-xs text-muted-foreground">{company?.name ?? "Unknown"}</p>
                    </div>
                    <PriorityBadge priority={job.priority} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{job.source ? SOURCE_LABELS[job.source] : "—"}</span>
                    {job.deadline && <span className={cn(overdue && "text-destructive")}>· Deadline {formatDate(job.deadline)}</span>}
                    {converted && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium">
                        <Check className="h-2.5 w-2.5" />Converted
                      </span>
                    )}
                  </div>
                  {salary && <p className="tnum mt-1 text-xs text-muted-foreground">{salary}</p>}
                  {job.notes && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{job.notes}</p>}
                  <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
                    <Button
                      size="sm"
                      variant={converted ? "outline" : "default"}
                      onClick={() => handleConvert(job)}
                      title={converted ? "Open the linked application" : "Convert to application"}
                    >
                      <ArrowRightCircle className="h-3.5 w-3.5" />{converted ? "Open" : "Convert"}
                    </Button>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <Button size="iconSm" variant="ghost" aria-label="Open job URL"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </a>
                    )}
                    <Button size="iconSm" variant="ghost" onClick={() => setEdit(job)} aria-label="Edit saved job"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="iconSm" variant="ghost" className="text-destructive" onClick={() => setDel(job)} aria-label="Delete saved job"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <AddSavedJobModal open={open} onOpenChange={setOpen} />
      <AddSavedJobModal open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)} job={edit ?? undefined} />
      <ConfirmDialog
        open={Boolean(del)}
        onOpenChange={(o) => !o && setDel(null)}
        title="Delete saved job?"
        description={`This removes “${del?.job_title}” from your saved list.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (del) deleteSavedJob(del.id) }}
      />
    </div>
  )
}
