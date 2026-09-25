import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Select, Field } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SOURCES, PRIORITIES, CURRENCIES, type Source, type Priority, type Currency, type SavedJob } from "@/types"
import { SOURCE_LABELS, PRIORITY_META } from "@/lib/constants"

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

  const { register, handleSubmit, reset } = useForm<{
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
  }>()

  useEffect(() => {
    if (open) {
      reset(
        job
          ? {
              job_title: job.job_title,
              companyName: "",
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
  }, [open, job, reset])

  const submit = (v: Record<string, string>) => {
    const payload = {
      job_title: v.job_title,
      companyName: v.companyName,
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
      const companyId = useJobStore.getState().upsertCompany(v.companyName)
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
            <Field label="Job title *" htmlFor="sj_title">
              <Input id="sj_title" required placeholder="Senior Product Manager" {...register("job_title", { required: true })} />
            </Field>
            <Field label="Company *" htmlFor="sj_company">
              <Input id="sj_company" required placeholder="Acme Corp" {...register("companyName", { required: true })} />
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
            <Button type="submit">{job ? "Save changes" : "Save job"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
