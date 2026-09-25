import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import type { Company } from "@/types"
import { normalizeCompanyName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Field } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CompanyForm {
  name: string
  website: string
  industry: string
  location: string
  notes: string
}

export function AddCompanyModal({
  open,
  onOpenChange,
  company,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  company?: Company
}) {
  const navigate = useNavigate()
  const companies = useJobStore((s) => s.companies)
  const upsertCompany = useJobStore((s) => s.upsertCompany)
  const updateCompany = useJobStore((s) => s.updateCompany)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyForm>()

  useEffect(() => {
    if (open) {
      reset(
        company
          ? { name: company.name, website: company.website ?? "", industry: company.industry ?? "", location: company.location ?? "", notes: company.notes ?? "" }
          : { name: "", website: "", industry: "", location: "", notes: "" },
      )
    }
  }, [open, company, reset])

  // Live duplicate detection (§14.3): normalize case/spacing and surface an
  // existing company with the same normalized name instead of silently creating
  // a second one. Excludes the record currently being edited.
  const nameValue = watch("name") ?? ""
  const normalized = normalizeCompanyName(nameValue)
  const duplicate =
    normalized.length > 0
      ? companies.find((c) => c.id !== company?.id && normalizeCompanyName(c.name) === normalized)
      : undefined

  const submit = (v: CompanyForm) => {
    const patch = {
      name: v.name.trim(),
      website: v.website || undefined,
      industry: v.industry || undefined,
      location: v.location || undefined,
      notes: v.notes || undefined,
    }
    if (company) {
      updateCompany(company.id, patch)
      toast.success("Company updated")
    } else {
      // upsertCompany reuses an existing company by normalized name.
      const id = upsertCompany(v.name.trim(), patch)
      toast.success(duplicate ? "Using existing company" : "Company saved")
      onOpenChange(false)
      if (duplicate) navigate(`/companies/${id}`)
      return
    }
    onOpenChange(false)
  }

  const useExisting = () => {
    if (!duplicate) return
    onOpenChange(false)
    navigate(`/companies/${duplicate.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{company ? "Edit company" : "Add company"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <Field label="Company name *" htmlFor="c_name" error={errors.name ? "Company name is required" : undefined}>
            <Input
              id="c_name"
              placeholder="Acme Corp"
              aria-invalid={errors.name ? true : undefined}
              {...register("name", { required: true, setValueAs: (v: string) => v.trim() })}
            />
          </Field>

          {duplicate && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {company ? "Another company already uses this name" : "This company already exists"}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  “{duplicate.name}” matches this name. {company ? "Saving won't merge them." : "Saving will reuse the existing record instead of creating a duplicate."}
                </p>
                <Button type="button" variant="outline" size="xs" className="mt-2" onClick={useExisting}>
                  Use existing
                </Button>
              </div>
            </div>
          )}

          <Field label="Website" htmlFor="c_website">
            <Input id="c_website" placeholder="https://acme.com" {...register("website")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry" htmlFor="c_industry">
              <Input id="c_industry" placeholder="Software" {...register("industry")} />
            </Field>
            <Field label="Location" htmlFor="c_location">
              <Input id="c_location" placeholder="Jakarta" {...register("location")} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="c_notes">
            <Textarea id="c_notes" placeholder="Anything worth remembering…" {...register("notes")} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{company ? "Save changes" : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
