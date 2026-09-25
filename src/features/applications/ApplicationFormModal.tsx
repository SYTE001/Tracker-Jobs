import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap } from "@/store/selectors"
import {
  STATUSES,
  SOURCES,
  WORK_MODES,
  JOB_TYPES,
  PRIORITIES,
  CURRENCIES,
  type Application,
  type JobStatus,
  type Source,
  type WorkMode,
  type JobType,
  type Currency,
  type Priority,
} from "@/types"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Select, Field } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SOURCE_LABELS, WORK_MODE_LABELS, JOB_TYPE_LABELS, PRIORITY_META, STATUS_META } from "@/lib/constants"
import { todayIso } from "@/lib/dates"

interface FormValues {
  job_title: string
  companyName: string
  status: JobStatus
  source: string
  job_url: string
  location: string
  work_mode: string
  job_type: string
  applied_date: string
  deadline: string
  salary_min: string
  salary_max: string
  currency: string
  priority: string
  tags: string
  notes: string
  recruiter_name: string
  recruiter_contact: string
}

const EMPTY: FormValues = {
  job_title: "",
  companyName: "",
  status: "applied",
  source: "linkedin",
  job_url: "",
  location: "",
  work_mode: "",
  job_type: "",
  applied_date: todayIso(),
  deadline: "",
  salary_min: "",
  salary_max: "",
  currency: "IDR",
  priority: "medium",
  tags: "",
  notes: "",
  recruiter_name: "",
  recruiter_contact: "",
}

export function ApplicationFormModal({
  open,
  onOpenChange,
  application,
  defaultStatus,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  application?: Application
  defaultStatus?: JobStatus
  onSaved?: (id: string) => void
}) {
  const addApplication = useJobStore((s) => s.addApplication)
  const updateApplication = useJobStore((s) => s.updateApplication)
  const companies = useCompanyMap()
  const editing = Boolean(application)
  const company = application ? companies.get(application.company_id) : undefined

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: EMPTY })

  useEffect(() => {
    if (open) {
      reset(
        application
          ? {
              job_title: application.job_title,
              companyName: company?.name ?? "",
              status: application.status,
              source: application.source,
              job_url: application.job_url ?? "",
              location: application.location ?? "",
              work_mode: application.work_mode ?? "",
              job_type: application.job_type ?? "",
              applied_date: application.applied_date ?? todayIso(),
              deadline: application.deadline ?? "",
              salary_min: application.salary_min?.toString() ?? "",
              salary_max: application.salary_max?.toString() ?? "",
              currency: application.currency ?? "IDR",
              priority: application.priority,
              tags: (application.tags ?? []).join(", "),
              notes: application.notes ?? "",
              recruiter_name: application.recruiter_name ?? "",
              recruiter_contact: application.recruiter_contact ?? "",
            }
          : { ...EMPTY, status: defaultStatus ?? EMPTY.status },
      )
    }
  }, [open, application, company?.name, reset, defaultStatus])

  const onSubmit = (values: FormValues) => {
    if (!values.job_title.trim()) {
      setError("job_title", { type: "manual", message: "Job title is required" })
      return
    }
    if (!values.companyName.trim()) {
      setError("companyName", { type: "manual", message: "Company is required" })
      return
    }
    if (values.job_url && !/^https?:\/\/.+/i.test(values.job_url.trim())) {
      setError("job_url", { type: "manual", message: "Must be a valid http(s) URL" })
      return
    }
    if (values.salary_min && values.salary_max && Number(values.salary_max) < Number(values.salary_min)) {
      setError("salary_max", { type: "manual", message: "Max must be ≥ min" })
      return
    }
    const payload = {
      job_title: values.job_title,
      companyName: values.companyName,
      status: values.status,
      source: values.source as Source,
      job_url: values.job_url || "",
      location: values.location || undefined,
      work_mode: (values.work_mode || undefined) as WorkMode,
      job_type: (values.job_type || undefined) as JobType,
      applied_date: values.applied_date || undefined,
      deadline: values.deadline || undefined,
      salary_min: values.salary_min ? Number(values.salary_min) : null,
      salary_max: values.salary_max ? Number(values.salary_max) : null,
      currency: values.currency as Currency,
      priority: values.priority as Priority,
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      notes: values.notes || undefined,
      recruiter_name: values.recruiter_name || undefined,
      recruiter_contact: values.recruiter_contact || undefined,
    }
    if (application) {
      updateApplication(application.id, payload)
      toast.success("Application updated")
      onSaved?.(application.id)
    } else {
      const id = addApplication(payload)
      toast.success("Application added")
      onSaved?.(id)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{editing ? "Edit application" : "Add application"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title *" error={errors.job_title?.message} htmlFor="job_title">
              <Input id="job_title" placeholder="Senior Frontend Engineer" {...register("job_title")} />
            </Field>
            <Field label="Company *" error={errors.companyName?.message} htmlFor="companyName">
              <Input id="companyName" placeholder="Acme Corp" {...register("companyName")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Status" error={errors.status?.message} htmlFor="status">
              <Select id="status" {...register("status")}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Source" htmlFor="source">
              <Select id="source" {...register("source")}>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority" htmlFor="priority">
              <Select id="priority" {...register("priority")}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job URL" error={errors.job_url?.message} htmlFor="job_url">
              <Input id="job_url" placeholder="https://…" {...register("job_url")} />
            </Field>
            <Field label="Location" htmlFor="location">
              <Input id="location" placeholder="Jakarta, Indonesia" {...register("location")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Work mode" htmlFor="work_mode">
              <Select id="work_mode" {...register("work_mode")}>
                <option value="">Any</option>
                {WORK_MODES.map((m) => (
                  <option key={m} value={m}>
                    {WORK_MODE_LABELS[m]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Job type" htmlFor="job_type">
              <Select id="job_type" {...register("job_type")}>
                <option value="">Any</option>
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {JOB_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Applied date" htmlFor="applied_date">
              <Input id="applied_date" type="date" {...register("applied_date")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min salary" htmlFor="salary_min">
              <Input id="salary_min" type="number" placeholder="5000000" {...register("salary_min")} />
            </Field>
            <Field label="Max salary" error={errors.salary_max?.message} htmlFor="salary_max">
              <Input id="salary_max" type="number" placeholder="12000000" {...register("salary_max")} />
            </Field>
            <Field label="Currency" htmlFor="currency">
              <Select id="currency" {...register("currency")}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Recruiter" htmlFor="recruiter_name">
              <Input id="recruiter_name" placeholder="Name" {...register("recruiter_name")} />
            </Field>
            <Field label="Recruiter contact" htmlFor="recruiter_contact">
              <Input id="recruiter_contact" placeholder="email / phone / LinkedIn" {...register("recruiter_contact")} />
            </Field>
          </div>

          <Field label="Tags (comma-separated)" htmlFor="tags">
            <Input id="tags" placeholder="frontend, fintech, remote" {...register("tags")} />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" placeholder="Anything worth remembering…" {...register("notes")} />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save changes" : "Add application"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
