import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import type { Company } from "@/types"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Field } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function AddCompanyModal({
  open,
  onOpenChange,
  company,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  company?: Company
}) {
  const upsertCompany = useJobStore((s) => s.upsertCompany)
  const updateCompany = useJobStore((s) => s.updateCompany)

  const { register, handleSubmit, reset } = useForm<{ name: string; website: string; industry: string; location: string; notes: string }>()

  useEffect(() => {
    if (open) {
      reset(
        company
          ? { name: company.name, website: company.website ?? "", industry: company.industry ?? "", location: company.location ?? "", notes: company.notes ?? "" }
          : { name: "", website: "", industry: "", location: "", notes: "" },
      )
    }
  }, [open, company, reset])

  const submit = (v: Record<string, string>) => {
    const patch = {
      name: v.name,
      website: v.website || undefined,
      industry: v.industry || undefined,
      location: v.location || undefined,
      notes: v.notes || undefined,
    }
    if (company) {
      updateCompany(company.id, patch)
      toast.success("Company updated")
    } else {
      upsertCompany(v.name, patch)
      toast.success("Company saved")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{company ? "Edit company" : "Add company"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <Field label="Company name *" htmlFor="c_name">
            <Input id="c_name" required placeholder="Acme Corp" {...register("name", { required: true })} />
          </Field>
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
            <Button type="submit">{company ? "Save changes" : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
