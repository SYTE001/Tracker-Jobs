import { Link } from "react-router-dom"
import { Moon, Sun, Monitor, Sparkles, Briefcase, Database, Info } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import type { Settings } from "@/types"
import { PRIORITIES, CURRENCIES } from "@/types"
import { STATUS_META, PRIORITY_META, STATUS_ORDER } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { PageHeader } from "@/components/shared"
import { cn } from "@/lib/utils"

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-primary" : "bg-muted")}
      >
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </button>
    </div>
  )
}

function SettingRow({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const settings = useJobStore((s) => s.settings)
  const setSettings = useJobStore((s) => s.setSettings)
  const patch = (p: Partial<Settings>) => setSettings(p)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Appearance, behavior, and about." />

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-muted-foreground" />Appearance</h3>
        <SettingRow icon={<Monitor className="h-4 w-4" />} title="Theme" description="Light, dark, or follow your system.">
          <div className="flex gap-1 rounded-md border border-border p-0.5">
            {([["light", Sun], ["dark", Moon], ["system", Monitor]] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => patch({ theme: mode })}
                className={cn("flex h-8 w-9 items-center justify-center rounded-md transition-colors", settings.theme === mode ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60")}
                aria-label={`${mode} theme`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow icon={<Monitor className="h-4 w-4" />} title="Default view" description="Where you land after adding a job.">
          <Select value={settings.default_view} onChange={(e) => patch({ default_view: e.target.value as Settings["default_view"] })} className="w-36">
            <option value="overview">Overview</option>
            <option value="board">Board</option>
            <option value="list">List</option>
          </Select>
        </SettingRow>
        <SettingRow icon={<Monitor className="h-4 w-4" />} title="Reduce motion" description="Minimize animations and transitions.">
          <Switch checked={settings.reduced_motion} onChange={(v) => patch({ reduced_motion: v })} label="Reduce motion" />
        </SettingRow>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Briefcase className="h-4 w-4 text-muted-foreground" />Defaults</h3>
        <SettingRow icon={<Briefcase className="h-4 w-4" />} title="Default status" description="Status applied to new applications.">
          <Select value={settings.default_status} onChange={(e) => patch({ default_status: e.target.value as Settings["default_status"] })} className="w-40">
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </Select>
        </SettingRow>
        <SettingRow icon={<Briefcase className="h-4 w-4" />} title="Default priority" description="Priority applied to new applications.">
          <Select value={settings.default_priority} onChange={(e) => patch({ default_priority: e.target.value as Settings["default_priority"] })} className="w-40">
            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
          </Select>
        </SettingRow>
        <SettingRow icon={<Briefcase className="h-4 w-4" />} title="Currency" description="Shown next to salaries.">
          <Select value={settings.currency} onChange={(e) => patch({ currency: e.target.value as Settings["currency"] })} className="w-24">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </SettingRow>
        <SettingRow icon={<Briefcase className="h-4 w-4" />} title="Ghosted threshold" description={`Mark as ghosted after this many days of no activity.`}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              value={settings.ghosted_threshold_days}
              onChange={(e) => patch({ ghosted_threshold_days: Math.max(1, Math.min(365, Number(e.target.value) || 21)) })}
              className="h-9 w-20 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Ghosted threshold days"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </SettingRow>
        <SettingRow icon={<Briefcase className="h-4 w-4" />} title="Auto-mark as ghosted" description="Automatically move inactive applications to Ghosted.">
          <Switch checked={settings.auto_mark_ghosted} onChange={(v) => patch({ auto_mark_ghosted: v })} label="Auto-mark ghosted" />
        </SettingRow>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Info className="h-4 w-4 text-muted-foreground" />About</h3>
        <SettingRow icon={<Info className="h-4 w-4" />} title="JobTrack" description="A local-first job application tracker. Version 1.0.0." />
        <div className="mt-2">
          <Link to="/settings/data">
            <Button variant="outline" size="sm"><Database className="h-3.5 w-3.5" />Data & backup</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
