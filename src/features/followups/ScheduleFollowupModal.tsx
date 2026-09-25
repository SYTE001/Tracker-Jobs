import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, Field } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { REMINDER_TYPES, type ReminderType } from "@/types"
import { REMINDER_LABELS } from "@/lib/constants"
import { todayIso } from "@/lib/dates"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  applicationId: string
  defaultDate?: string
}

export function ScheduleFollowupModal({ open, onOpenChange, applicationId, defaultDate }: Props) {
  const addReminder = useJobStore((s) => s.addReminder)

  const { register, handleSubmit, reset } = useForm<{
    reminder_type: ReminderType
    reminder_date: string
  }>()

  useEffect(() => {
    if (open) {
      reset({ reminder_type: "followup_recruiter", reminder_date: defaultDate ?? todayIso() })
    }
  }, [open, defaultDate, reset])

  const submit = (v: { reminder_type: ReminderType; reminder_date: string }) => {
    addReminder({ application_id: applicationId, reminder_type: v.reminder_type, reminder_date: v.reminder_date })
    toast.success("Follow-up scheduled")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Schedule follow-up</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <Field label="Reminder" htmlFor="reminder_type">
            <Select id="reminder_type" {...register("reminder_type")}>
              {REMINDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {REMINDER_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" htmlFor="reminder_date">
            <Input id="reminder_date" type="date" {...register("reminder_date", { required: true })} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
