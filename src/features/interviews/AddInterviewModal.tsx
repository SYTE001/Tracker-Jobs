import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Select, Field } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { INTERVIEW_TYPES, type InterviewType, type Interview } from "@/types"
import { INTERVIEW_TYPE_LABELS } from "@/lib/constants"
import { todayIso } from "@/lib/dates"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  applicationId: string
  /** When provided, the modal edits this interview instead of creating a new one. */
  interview?: Interview
}

interface FormValues {
  stage: string
  type: InterviewType
  date: string
  start_time: string
  end_time: string
  interviewer: string
  meeting_url: string
  location: string
  notes: string
  result: string
  follow_up_date: string
}

const EMPTY: FormValues = {
  stage: "Initial",
  type: "video",
  date: todayIso(),
  start_time: "",
  end_time: "",
  interviewer: "",
  meeting_url: "",
  location: "",
  notes: "",
  result: "",
  follow_up_date: "",
}

export function AddInterviewModal({ open, onOpenChange, applicationId, interview }: Props) {
  const addInterview = useJobStore((s) => s.addInterview)
  const updateInterview = useJobStore((s) => s.updateInterview)
  const isEdit = Boolean(interview)

  const { register, handleSubmit, reset } = useForm<FormValues>()

  useEffect(() => {
    if (!open) return
    if (interview) {
      reset({
        stage: interview.stage ?? "",
        type: interview.type,
        date: interview.date,
        start_time: interview.start_time ?? "",
        end_time: interview.end_time ?? "",
        interviewer: interview.interviewer ?? "",
        meeting_url: interview.meeting_url ?? "",
        location: interview.location ?? "",
        notes: interview.notes ?? "",
        result: interview.result ?? "",
        follow_up_date: interview.follow_up_date ?? "",
      })
    } else {
      reset(EMPTY)
    }
  }, [open, interview, reset])

  const submit = (v: FormValues) => {
    const patch = {
      stage: v.stage || undefined,
      type: v.type as InterviewType,
      date: v.date,
      start_time: v.start_time || undefined,
      end_time: v.end_time || undefined,
      interviewer: v.interviewer || undefined,
      meeting_url: v.meeting_url || undefined,
      location: v.location || undefined,
      notes: v.notes || undefined,
      result: v.result || undefined,
      follow_up_date: v.follow_up_date || undefined,
    }
    if (interview) {
      updateInterview(interview.id, patch)
      toast.success("Interview updated")
    } else {
      addInterview({ application_id: applicationId, ...patch })
      toast.success("Interview added")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{isEdit ? "Edit interview" : "Add interview"}</DialogTitle>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date" htmlFor="date">
              <Input id="date" type="date" {...register("date", { required: true })} />
            </Field>
            <Field label="Start time" htmlFor="start_time">
              <Input id="start_time" type="time" {...register("start_time")} />
            </Field>
            <Field label="End time" htmlFor="end_time">
              <Input id="end_time" type="time" {...register("end_time")} />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Result" htmlFor="result" hint="Setting a result marks the interview complete.">
              <Input id="result" placeholder="Passed / Rejected / Pending…" {...register("result")} />
            </Field>
            <Field label="Follow-up date" htmlFor="follow_up_date">
              <Input id="follow_up_date" type="date" {...register("follow_up_date")} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" placeholder="Anything about this interview…" {...register("notes")} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Save changes" : "Add interview"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
