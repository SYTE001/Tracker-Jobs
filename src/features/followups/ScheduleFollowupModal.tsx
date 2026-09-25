import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, Field } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { REMINDER_TYPES, type ReminderType } from "@/types"
import { REMINDER_LABELS } from "@/lib/constants"
import { todayIso, formatDate } from "@/lib/dates"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  applicationId: string
  defaultDate?: string
}

export function ScheduleFollowupModal({ open, onOpenChange, applicationId, defaultDate }: Props) {
  const addReminder = useJobStore((s) => s.addReminder)
  const reminders = useJobStore((s) => s.reminders)

  const { register, handleSubmit, reset, watch } = useForm<{
    reminder_type: ReminderType
    reminder_date: string
  }>()

  useEffect(() => {
    if (open) {
      reset({ reminder_type: "followup_recruiter", reminder_date: defaultDate ?? todayIso() })
    }
  }, [open, defaultDate, reset])

  const watchedType = watch("reminder_type")
  const watchedDate = watch("reminder_date")

  // Duplicate = same application + type + date, still open (not completed).
  const duplicate = reminders.find(
    (r) =>
      !r.completed &&
      r.application_id === applicationId &&
      r.reminder_type === watchedType &&
      r.reminder_date === watchedDate,
  )

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

          {duplicate && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-700 dark:text-amber-400"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                An identical follow-up ({REMINDER_LABELS[watchedType]} on {formatDate(watchedDate, "MMM d")}) is already
                scheduled. Schedule anyway?
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={duplicate ? "secondary" : "default"}>
              {duplicate ? "Schedule anyway" : "Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
