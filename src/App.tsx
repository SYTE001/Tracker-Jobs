import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Shell } from "@/components/layout/Shell"
import { Onboarding } from "@/components/Onboarding"
import { LoadingState } from "@/components/shared"

const OverviewPage = lazy(() => import("@/features/overview/OverviewPage").then((m) => ({ default: m.OverviewPage })))
const ApplicationsPage = lazy(() => import("@/features/applications/ApplicationsPage").then((m) => ({ default: m.ApplicationsPage })))
const ApplicationDetailPage = lazy(() => import("@/features/applications/ApplicationDetailPage").then((m) => ({ default: m.ApplicationDetailPage })))
const BoardPage = lazy(() => import("@/features/board/BoardPage").then((m) => ({ default: m.BoardPage })))
const SavedPage = lazy(() => import("@/features/saved/SavedPage").then((m) => ({ default: m.SavedPage })))
const InterviewsPage = lazy(() => import("@/features/interviews/InterviewsPage").then((m) => ({ default: m.InterviewsPage })))
const FollowupsPage = lazy(() => import("@/features/followups/FollowupsPage").then((m) => ({ default: m.FollowupsPage })))
const CompaniesPage = lazy(() => import("@/features/companies/CompaniesPage").then((m) => ({ default: m.CompaniesPage })))
const CompanyDetailPage = lazy(() => import("@/features/companies/CompanyDetailPage").then((m) => ({ default: m.CompanyDetailPage })))
const MetricsPage = lazy(() => import("@/features/metrics/MetricsPage").then((m) => ({ default: m.MetricsPage })))
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })))
const DataPage = lazy(() => import("@/features/settings/DataPage").then((m) => ({ default: m.DataPage })))
const NotFoundPage = lazy(() => import("@/features/NotFoundPage").then((m) => ({ default: m.NotFoundPage })))

function Page({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingState />}>{children}</Suspense>
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Onboarding />
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Page><OverviewPage /></Page>} />
          <Route path="/applications" element={<Page><ApplicationsPage /></Page>} />
          <Route path="/applications/:id" element={<Page><ApplicationDetailPage /></Page>} />
          <Route path="/board" element={<Page><BoardPage /></Page>} />
          <Route path="/saved" element={<Page><SavedPage /></Page>} />
          <Route path="/interviews" element={<Page><InterviewsPage /></Page>} />
          <Route path="/followups" element={<Page><FollowupsPage /></Page>} />
          <Route path="/companies" element={<Page><CompaniesPage /></Page>} />
          <Route path="/companies/:id" element={<Page><CompanyDetailPage /></Page>} />
          <Route path="/metrics" element={<Page><MetricsPage /></Page>} />
          <Route path="/settings" element={<Page><SettingsPage /></Page>} />
          <Route path="/settings/appearance" element={<Navigate to="/settings" replace />} />
          <Route path="/settings/data" element={<Page><DataPage /></Page>} />
          <Route path="*" element={<Page><NotFoundPage /></Page>} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
