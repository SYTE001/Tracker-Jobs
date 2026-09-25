import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Select, Field } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { INTERVIEW_TYPES, type InterviewType } from "@/types"
import { INTERVIEW_TYPE_LABELS } from "@/lib/constants"
import { todayIso } from "@/lib/dates"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  applicationId: string
}

export function AddInterviewModal({ open, onOpenChange, applicationId }: Props) {
  const addInterview = useJobStore((s) => s.addInterview)

  const { register, handleSubmit, reset } = useForm<{
    stage: string
    type: InterviewType
    date: string
    start_time: string
    interviewer: string
    meeting_url: string
    location: string
    notes: string
  }>()

  useEffect(() => {
    if (open) reset({ stage: "Initial", type: "video", date: todayIso(), start_time: "", interviewer: "", meeting_url: "", location: "", notes: "" })
  }, [open, reset])

  const submit = (v: Record<string, string>) => {
    addInterview({
      application_id: applicationId,
      stage: v.stage || undefined,
      type: v.type as InterviewType,
      date: v.date,
      start_time: v.start_time || undefined,
      interviewer: v.interviewer || undefined,
      meeting_url: v.meeting_url || undefined,
      location: v.location || undefined,
      notes: v.notes || undefined,
    })
    toast.success("Interview added")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Add interview</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Stage" htmlFor="stage">
              <Input id="stage" placeholder="Initial / Technical / Final" {...register("stage")} />
            </Field>
            <Field label="Type" htmlFor="type">
              <Select id="type" {...register("type")}>
                {INTERVIEW_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {INTERVIEW_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="date">
              <Input id="date" type="date" {...register("date", { required: true })} />
            </Field>
            <Field label="Start time" htmlFor="start_time">
              <Input id="start_time" type="time" {...register("start_time")} />
            </Field>
          </div>
          <Field label="Interviewer" htmlFor="interviewer">
            <Input id="interviewer" placeholder="Name" {...register("interviewer")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Meeting URL" htmlFor="meeting_url">
              <Input id="meeting_url" placeholder="https://meet…" {...register("meeting_url")} />
            </Field>
            <Field label="Location" htmlFor="location">
              <Input id="location" placeholder="Office / city" {...register("location")} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" placeholder="Anything about this interview…" {...register("notes")} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add interview</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
