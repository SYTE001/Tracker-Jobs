import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Building2, Search, ExternalLink } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { companyStats } from "@/features/metrics/metrics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CompanyLogo, EmptyState, PageHeader } from "@/components/shared"
import { AddCompanyModal } from "./AddCompanyModal"

export function CompaniesPage() {
  const companies = useJobStore((s) => s.companies)
  const applications = useJobStore((s) => s.applications)
  const interviews = useJobStore((s) => s.interviews)

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    return companies
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.industry ?? "").toLowerCase().includes(q))
      .map((c) => ({ company: c, stats: companyStats(applications, interviews, c.id) }))
      .sort((a, b) => b.stats.total - a.stats.total)
  }, [companies, applications, interviews, query])

  if (companies.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Companies"
          description="Every company you've applied to or saved."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add company</Button>}
        />
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="Companies appear here as you add jobs"
          description="Add a company manually, or they'll be created automatically when you add an application."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add company</Button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Companies"
        description={`${companies.length} companies`}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add company</Button>}
      />
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search companies…" className="pl-8" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ company, stats }) => (
          <Link
            key={company.id}
            to={`/companies/${company.id}`}
            className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <CompanyLogo company={company} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{company.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[company.industry, company.location].filter(Boolean).join(" · ") || "No details"}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{stats.total} app{stats.total === 1 ? "" : "s"}</span>
                <span className="text-blue-500">{stats.active} active</span>
                <span className="text-violet-500">{stats.interviews} interviews</span>
                <span className="text-emerald-500">{stats.offers} offers</span>
              </div>
            </div>
            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      <AddCompanyModal open={open} onOpenChange={setOpen} />
    </div>
  )
}
