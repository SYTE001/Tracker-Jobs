import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap } from "@/store/selectors"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Select, Field } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SOURCES, PRIORITIES, CURRENCIES, type Source, type Priority, type Currency, type SavedJob } from "@/types"
import { SOURCE_LABELS, PRIORITY_META } from "@/lib/constants"

interface SavedJobForm {
  job_title: string
  companyName: string
  source: Source
  url: string
  salary_min: string
  salary_max: string
  currency: Currency
  deadline: string
  priority: Priority
  notes: string
}

export function AddSavedJobModal({
  open,
  onOpenChange,
  job,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  job?: SavedJob
}) {
  const addSavedJob = useJobStore((s) => s.addSavedJob)
  const updateSavedJob = useJobStore((s) => s.updateSavedJob)
  const companyMap = useCompanyMap()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SavedJobForm>()

  useEffect(() => {
    if (open) {
      reset(
        job
          ? {
              job_title: job.job_title,
              // BUG FIX (§13.1): repopulate the company name from company_id so
              // editing preserves the existing company relationship instead of
              // resetting it to an empty value.
              companyName: companyMap.get(job.company_id)?.name ?? "",
              source: job.source,
              url: job.url ?? "",
              salary_min: job.salary_min?.toString() ?? "",
              salary_max: job.salary_max?.toString() ?? "",
              currency: job.currency ?? "IDR",
              deadline: job.deadline ?? "",
              priority: job.priority,
              notes: job.notes ?? "",
            }
          : {
              job_title: "",
              companyName: "",
              source: "linkedin",
              url: "",
              salary_min: "",
              salary_max: "",
              currency: "IDR",
              deadline: "",
              priority: "medium",
              notes: "",
            },
      )
    }
  }, [open, job, reset, companyMap])

  const submit = (v: SavedJobForm) => {
    const payload = {
      job_title: v.job_title.trim(),
      companyName: v.companyName.trim(),
      source: v.source as Source,
      url: v.url || undefined,
      salary_min: v.salary_min ? Number(v.salary_min) : null,
      salary_max: v.salary_max ? Number(v.salary_max) : null,
      currency: v.currency as Currency,
      deadline: v.deadline || undefined,
      priority: v.priority as Priority,
      notes: v.notes || undefined,
    }
    if (job) {
      // Resolve (or reuse) the company by name, preserving the relationship.
      const companyId = useJobStore.getState().upsertCompany(payload.companyName)
      updateSavedJob(job.id, {
        ...payload,
        company_id: companyId,
      })
      toast.success("Saved job updated")
    } else {
      addSavedJob(payload)
      toast.success("Job saved")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{job ? "Edit saved job" : "Save a job"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title *" htmlFor="sj_title" error={errors.job_title ? "Job title is required" : undefined}>
              <Input
                id="sj_title"
                placeholder="Senior Product Manager"
                aria-invalid={errors.job_title ? true : undefined}
                {...register("job_title", { required: true, setValueAs: (v: string) => v.trim() })}
              />
            </Field>
            <Field label="Company *" htmlFor="sj_company" error={errors.companyName ? "Company is required" : undefined}>
              <Input
                id="sj_company"
                placeholder="Acme Corp"
                aria-invalid={errors.companyName ? true : undefined}
                {...register("companyName", { required: true, setValueAs: (v: string) => v.trim() })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Source" htmlFor="sj_source">
              <Select id="sj_source" {...register("source")}>
                {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
              </Select>
            </Field>
            <Field label="Priority" htmlFor="sj_priority">
              <Select id="sj_priority" {...register("priority")}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
              </Select>
            </Field>
            <Field label="Deadline" htmlFor="sj_deadline">
              <Input id="sj_deadline" type="date" {...register("deadline")} />
            </Field>
          </div>
          <Field label="Job URL" htmlFor="sj_url">
            <Input id="sj_url" placeholder="https://…" {...register("url")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min salary" htmlFor="sj_min"><Input id="sj_min" type="number" {...register("salary_min")} /></Field>
            <Field label="Max salary" htmlFor="sj_max"><Input id="sj_max" type="number" {...register("salary_max")} /></Field>
            <Field label="Currency" htmlFor="sj_currency">
              <Select id="sj_currency" {...register("currency")}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Notes" htmlFor="sj_notes">
            <Textarea id="sj_notes" placeholder="Why save this one?" {...register("notes")} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{job ? "Save changes" : "Save job"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
