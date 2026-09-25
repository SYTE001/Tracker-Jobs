import { useMemo, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import type { SearchFilters } from "@/lib/search"
import type { SortKey } from "@/lib/search"
import { STATUS_META, SOURCE_LABELS, PRIORITY_META, WORK_MODE_LABELS, JOB_TYPE_LABELS } from "@/lib/constants"

/** Keys represented in the URL query string. */
const KEYS = [
  "q",
  "status",
  "source",
  "priority",
  "mode",
  "type",
  "company",
  "tag",
  "archived",
  "due",
  "interview",
  "sort",
  "dir",
] as const

export interface ActiveFilterChip {
  key: string
  label: string
  value: string
}

export interface ApplicationFilterState {
  filters: SearchFilters
  sort: { key: SortKey; dir: "asc" | "desc" }
  /** Update one or more URL-backed values; empty string / undefined clears a key. */
  set: (patch: Record<string, string | boolean | undefined>) => void
  clearAll: () => void
  removeChip: (key: string) => void
  chips: ActiveFilterChip[]
  hasActiveFilters: boolean
}

/**
 * URL-backed application filter + sort state so filtered views can be
 * bookmarked and survive refresh (PRD §7.4 / §18).
 */
export function useApplicationFilters(defaults?: Partial<SearchFilters>): ApplicationFilterState {
  const [params, setParams] = useSearchParams()

  const get = useCallback((k: string) => params.get(k) ?? "", [params])

  const filters: SearchFilters = useMemo(
    () => ({
      query: get("q") || undefined,
      status: get("status") || defaults?.status || undefined,
      source: get("source") || undefined,
      priority: get("priority") || undefined,
      work_mode: get("mode") || undefined,
      job_type: get("type") || undefined,
      company_id: get("company") || undefined,
      tag: get("tag") || undefined,
      archived: get("archived") === "1" ? "all" : false,
      followup_due: get("due") === "1" || undefined,
      interview_upcoming: get("interview") === "1" || undefined,
    }),
    [get, defaults?.status],
  )

  const sort = useMemo(
    () => ({
      key: (get("sort") || "updated") as SortKey,
      dir: (get("dir") || "desc") as "asc" | "desc",
    }),
    [get],
  )

  const set = useCallback(
    (patch: Record<string, string | boolean | undefined>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === "" || v === false) next.delete(k)
            else next.set(k, v === true ? "1" : String(v))
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const clearAll = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const k of KEYS) next.delete(k)
        return next
      },
      { replace: true },
    )
  }, [setParams])

  const removeChip = useCallback((key: string) => set({ [key]: undefined }), [set])

  const chips: ActiveFilterChip[] = useMemo(() => {
    const out: ActiveFilterChip[] = []
    const q = get("q")
    if (q) out.push({ key: "q", label: "Search", value: q })
    const status = get("status")
    if (status) out.push({ key: "status", label: "Status", value: STATUS_META[status as keyof typeof STATUS_META]?.label ?? status })
    const source = get("source")
    if (source) out.push({ key: "source", label: "Source", value: SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] ?? source })
    const priority = get("priority")
    if (priority) out.push({ key: "priority", label: "Priority", value: PRIORITY_META[priority as keyof typeof PRIORITY_META]?.label ?? priority })
    const mode = get("mode")
    if (mode) out.push({ key: "mode", label: "Mode", value: WORK_MODE_LABELS[mode as keyof typeof WORK_MODE_LABELS] ?? mode })
    const type = get("type")
    if (type) out.push({ key: "type", label: "Type", value: JOB_TYPE_LABELS[type as keyof typeof JOB_TYPE_LABELS] ?? type })
    const tag = get("tag")
    if (tag) out.push({ key: "tag", label: "Tag", value: tag })
    if (get("due") === "1") out.push({ key: "due", label: "Follow-up", value: "Due" })
    if (get("interview") === "1") out.push({ key: "interview", label: "Interview", value: "Upcoming" })
    if (get("archived") === "1") out.push({ key: "archived", label: "Archived", value: "Included" })
    return out
  }, [get])

  return { filters, sort, set, clearAll, removeChip, chips, hasActiveFilters: chips.length > 0 }
}
