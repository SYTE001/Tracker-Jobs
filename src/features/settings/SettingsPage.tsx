import { Link } from "react-router-dom"
import { Moon, Sun, Monitor, Database, ExternalLink } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import type { Settings } from "@/types"
import { PRIORITIES, CURRENCIES } from "@/types"
import { STATUS_META, PRIORITY_META, STATUS_ORDER } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { PageHeader, Section } from "@/components/shared"
import { cn } from "@/lib/utils"

const REPO_URL = "https://github.com/tracker-jobs/tracker-jobs"
const APP_VERSION = "1.0.0"

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-150",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

function Row({
  title,
  description,
  htmlFor,
  children,
}: {
  title: string
  description?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-sm font-medium">
          {title}
        </label>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const settings = useJobStore((s) => s.settings)
  const setSettings = useJobStore((s) => s.setSettings)
  const patch = (p: Partial<Settings>) => setSettings(p)

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <PageHeader title="Settings" description="Appearance, behavior, and about — set once, rarely touched." />

      {/* ---- Appearance --------------------------------------------- */}
      <Section title="Appearance">
        <div>
          <Row title="Theme" description="Light, dark, or follow your system.">
            <div role="radiogroup" aria-label="Theme" className="flex gap-1 rounded-md border border-border p-0.5">
              {([["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "System"]] as const).map(
                ([m, Icon, lbl]) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={settings.theme === m}
                    onClick={() => patch({ theme: m })}
                    className={cn(
                      "flex h-8 min-w-9 items-center justify-center rounded-md px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      settings.theme === m ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60",
                    )}
                    aria-label={`${lbl} theme`}
                    title={lbl}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ),
              )}
            </div>
          </Row>
          <Row title="Reduce motion" description="Minimize animations and transitions.">
            <Switch checked={settings.reduced_motion} onChange={(v) => patch({ reduced_motion: v })} label="Reduce motion" />
          </Row>
        </div>
      </Section>

      {/* ---- Behavior ----------------------------------------------- */}
      <Section title="Behavior">
        <div>
          <Row
            htmlFor="ghosted-threshold"
            title="Ghosted threshold"
            description="Days of no activity before an application is considered ghosted."
          >
            <div className="flex items-center gap-2">
              <input
                id="ghosted-threshold"
                type="number"
                min={1}
                max={365}
                value={settings.ghosted_threshold_days}
                onChange={(e) =>
                  patch({ ghosted_threshold_days: Math.max(1, Math.min(365, Number(e.target.value) || 21)) })
                }
                className="h-9 w-20 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </Row>
          <Row title="Auto-mark as ghosted" description="Automatically move inactive applications to Ghosted.">
            <Switch
              checked={settings.auto_mark_ghosted}
              onChange={(v) => patch({ auto_mark_ghosted: v })}
              label="Auto-mark ghosted"
            />
          </Row>
          <Row htmlFor="default-status" title="Default status" description="Status applied to new applications.">
            <Select
              id="default-status"
              value={settings.default_status}
              onChange={(e) => patch({ default_status: e.target.value as Settings["default_status"] })}
              className="w-40"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </Row>
          <Row htmlFor="default-priority" title="Default priority" description="Priority applied to new applications.">
            <Select
              id="default-priority"
              value={settings.default_priority}
              onChange={(e) => patch({ default_priority: e.target.value as Settings["default_priority"] })}
              className="w-40"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </Row>
          <Row htmlFor="default-view" title="Default view" description="Where you land after adding a job.">
            <Select
              id="default-view"
              value={settings.default_view}
              onChange={(e) => patch({ default_view: e.target.value as Settings["default_view"] })}
              className="w-40"
            >
              <option value="overview">Overview</option>
              <option value="board">Board</option>
              <option value="list">List</option>
            </Select>
          </Row>
          <Row htmlFor="currency" title="Currency" description="Shown next to salaries.">
            <Select
              id="currency"
              value={settings.currency}
              onChange={(e) => patch({ currency: e.target.value as Settings["currency"] })}
              className="w-24"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Row>
        </div>
      </Section>

      {/* ---- About -------------------------------------------------- */}
      <Section title="About">
        <div>
          <Row title="JobTrack" description={`Version ${APP_VERSION}`}>
            <Link to="/settings/data">
              <Button variant="outline" size="sm">
                <Database className="h-3.5 w-3.5" />
                Data &amp; backup
              </Button>
            </Link>
          </Row>
          <Row title="Repository" description="Source code and issues.">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Row>
          <div className="py-3.5">
            <p className="text-[13px] text-muted-foreground">
              JobTrack is local-first. All of your applications, companies, and notes live only in this browser —
              nothing is sent to a server. Use Data &amp; backup to export or move your data.
            </p>
          </div>
        </div>
      </Section>
    </div>
  )
}
