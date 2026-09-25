import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Building2, Search, ExternalLink, Table2, LayoutGrid } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { companyStats } from "@/features/metrics/metrics"
import { relativeTime } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { CompanyLogo, EmptyState, PageHeader } from "@/components/shared"
import { AddCompanyModal } from "./AddCompanyModal"

type SortKey = "activity" | "name" | "applications" | "active" | "interviews" | "offers"

const SORT_LABELS: Record<SortKey, string> = {
  activity: "Latest activity",
  name: "Name",
  applications: "Applications",
  active: "Active",
  interviews: "Interviews",
  offers: "Offers",
}

export function CompaniesPage() {
  const companies = useJobStore((s) => s.companies)
  const applications = useJobStore((s) => s.applications)
  const interviews = useJobStore((s) => s.interviews)

  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("activity")
  const [view, setView] = useState<"table" | "cards" | null>(null)
  const [open, setOpen] = useState(false)

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    const list = companies
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.industry ?? "").toLowerCase().includes(q) || (c.location ?? "").toLowerCase().includes(q))
      .map((c) => {
        const apps = applications.filter((a) => a.company_id === c.id)
        const lastActivity = apps.reduce<string>((acc, a) => (a.updated_at > acc ? a.updated_at : acc), "")
        return { company: c, stats: companyStats(applications, interviews, c.id), lastActivity }
      })
    list.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.company.name.localeCompare(b.company.name)
        case "applications":
          return b.stats.total - a.stats.total
        case "active":
          return b.stats.active - a.stats.active
        case "interviews":
          return b.stats.interviews - a.stats.interviews
        case "offers":
          return b.stats.offers - a.stats.offers
        case "activity":
        default:
          return (b.lastActivity || "").localeCompare(a.lastActivity || "")
      }
    })
    return list
  }, [companies, applications, interviews, query, sort])

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
          title="Companies appear here as you add jobs."
          description="Add a company manually, or they'll be created automatically when you add an application."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add company</Button>}
        />
        <AddCompanyModal open={open} onOpenChange={setOpen} />
      </div>
    )
  }

  const effectiveView = view ?? (companies.length > 6 ? "table" : "cards")

  return (
    <div className="space-y-4">
      <PageHeader
        title="Companies"
        description={`${companies.length} ${companies.length === 1 ? "company" : "companies"}`}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add company</Button>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search companies…" className="pl-8" aria-label="Search companies" />
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort companies">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <option key={k} value={k}>Sort: {SORT_LABELS[k]}</option>
          ))}
        </Select>
        <div className="hidden items-center rounded-md border border-border p-0.5 sm:flex" role="group" aria-label="View">
          <Button size="iconSm" variant={effectiveView === "table" ? "secondary" : "ghost"} onClick={() => setView("table")} aria-label="Table view" aria-pressed={effectiveView === "table"}>
            <Table2 className="h-4 w-4" />
          </Button>
          <Button size="iconSm" variant={effectiveView === "cards" ? "secondary" : "ghost"} onClick={() => setView("cards")} aria-label="Card view" aria-pressed={effectiveView === "cards"}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState compact title="No companies match" description="Try a different search term." />
      ) : effectiveView === "table" ? (
        <div className="hidden overflow-hidden rounded-lg border border-border sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 text-right font-medium">Applications</th>
                <th className="px-3 py-2 text-right font-medium">Active</th>
                <th className="px-3 py-2 text-right font-medium">Interviews</th>
                <th className="px-3 py-2 text-right font-medium">Offers</th>
                <th className="px-3 py-2 font-medium">Latest activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ company, stats, lastActivity }) => (
                <tr key={company.id} className="group cursor-pointer transition-colors hover:bg-accent/40">
                  <td className="px-3 py-2.5">
                    <Link to={`/companies/${company.id}`} className="flex items-center gap-2.5 outline-none">
                      <CompanyLogo company={company} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium group-hover:underline">{company.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[company.industry, company.location].filter(Boolean).join(" · ") || "No details"}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="tnum px-3 py-2.5 text-right">{stats.total}</td>
                  <td className="tnum px-3 py-2.5 text-right">{stats.active}</td>
                  <td className="tnum px-3 py-2.5 text-right">{stats.interviews}</td>
                  <td className="tnum px-3 py-2.5 text-right">{stats.offers}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{lastActivity ? relativeTime(lastActivity) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Cards: always the mobile representation; also the desktop view for small sets. */}
      <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", effectiveView === "table" && "sm:hidden")}>
        {rows.map(({ company, stats, lastActivity }) => (
          <Link
            key={company.id}
            to={`/companies/${company.id}`}
            className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
          >
            <CompanyLogo company={company} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{company.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[company.industry, company.location].filter(Boolean).join(" · ") || "No details"}
              </p>
              <div className="tnum mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{stats.total} app{stats.total === 1 ? "" : "s"}</span>
                <span>{stats.active} active</span>
                <span>{stats.interviews} interviews</span>
                <span>{stats.offers} offers</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{lastActivity ? `Active ${relativeTime(lastActivity)}` : "No activity yet"}</p>
            </div>
            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      <AddCompanyModal open={open} onOpenChange={setOpen} />
    </div>
  )
}
