import { useNavigate, useParams } from "react-router-dom"
import { useJobStore } from "@/store/useJobStore"
import { ApplicationDetail } from "./ApplicationDetail"
import { EmptyState } from "@/components/shared"
import { Button } from "@/components/ui/button"

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const app = useJobStore((s) => s.applications.find((a) => a.id === id) ?? null)

  if (!app) {
    return (
      <EmptyState
        title="Application not found"
        description="It may have been deleted."
        action={<Button onClick={() => navigate("/applications")}>Back to applications</Button>}
      />
    )
  }
  return (
    <ApplicationDetail
      application={app}
      open
      onOpenChange={(o) => {
        if (!o) navigate("/applications")
      }}
    />
  )
}
