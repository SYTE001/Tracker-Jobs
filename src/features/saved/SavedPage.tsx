import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Bookmark, ExternalLink, Pencil, Trash2, ArrowRightCircle, Search } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap } from "@/store/selectors"
import { type SavedJob } from "@/types"
import { SOURCES } from "@/types"
import { SOURCE_LABELS } from "@/lib/constants"
import { formatDate } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { CompanyLogo, EmptyState, PriorityBadge, PageHeader, ConfirmDialog } from "@/components/shared"
import { AddSavedJobModal } from "./AddSavedJobModal"

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

  if (savedJobs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Saved Jobs" description="Opportunities you've bookmarked before applying." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Save a job</Button>} />
        <EmptyState icon={<Bookmark className="h-5 w-5" />} title="Save opportunities here before applying" description="Keep promising roles on your radar, then convert them into applications in one click." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Save a job</Button>} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Saved Jobs" description={`${rows.length} saved ${rows.length === 1 ? "job" : "jobs"}`} action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Save a job</Button>} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search saved jobs…" className="pl-8" />
        </div>
        <Select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((job) => {
          const company = companyMap.get(job.company_id)
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
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{job.source ? SOURCE_LABELS[job.source] : "—"}</span>
                {job.deadline && <span>· Deadline {formatDate(job.deadline)}</span>}
              </div>
              {(job.salary_min != null || job.salary_max != null) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {job.salary_min?.toLocaleString() ?? "…"}–{job.salary_max?.toLocaleString() ?? "…"} {job.currency}
                </p>
              )}
              {job.notes && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{job.notes}</p>}
              <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
                <Button size="sm" variant="default" onClick={() => { const id = convertSavedJob(job.id); if (id) navigate(`/applications/${id}`) }}>
                  <ArrowRightCircle className="h-3.5 w-3.5" /> Apply
                </Button>
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <Button size="iconSm" variant="ghost" aria-label="Open URL"><ExternalLink className="h-3.5 w-3.5" /></Button>
                  </a>
                )}
                <Button size="iconSm" variant="ghost" onClick={() => setEdit(job)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="iconSm" variant="ghost" className="text-destructive" onClick={() => setDel(job)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )
        })}
      </div>

      {rows.length === 0 && <EmptyState compact title="No saved jobs match" description="Try a different search or source." />}

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
