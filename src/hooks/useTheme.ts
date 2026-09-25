import { useEffect } from "react"
import { useJobStore } from "@/store/useJobStore"

/** Apply the configured theme (light/dark/system) to <html>. */
export function useTheme() {
  const mode = useJobStore((s) => s.settings.theme)
  const reducedMotion = useJobStore((s) => s.settings.reduced_motion)

  useEffect(() => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")
    const apply = () => {
      const dark = mode === "system" ? prefersDark?.matches : mode === "dark"
      document.documentElement.classList.toggle("dark", !!dark)
    }
    apply()
    if (mode === "system" && prefersDark) {
      prefersDark.addEventListener("change", apply)
      return () => prefersDark.removeEventListener("change", apply)
    }
  }, [mode])

  useEffect(() => {
    if (reducedMotion) document.documentElement.classList.add("reduce-motion")
    else document.documentElement.classList.remove("reduce-motion")
  }, [reducedMotion])
}
