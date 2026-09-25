import type { JobStatus, Priority, Source, WorkMode, JobType, ReminderType, InterviewType } from "@/types"

/**
 * Status metadata. Near-monochrome system: the in-progress stages
 * (wishlist → applied → interviewing) read as a neutral grayscale ramp; real
 * color is reserved for the three semantic outcomes (offer = positive,
 * rejected = negative, ghosted = warning). Badges are neutral surfaces so
 * color only ever appears as a small dot, never a saturated fill.
 */
const NEUTRAL_BADGE =
  "bg-muted text-foreground/80 border-border dark:bg-muted dark:text-foreground/80"

export const STATUS_META: Record<
  JobStatus,
  { label: string; dot: string; badge: string; text: string }
> = {
  wishlist: {
    label: "Wishlist",
    dot: "bg-zinc-300 dark:bg-zinc-600",
    badge: NEUTRAL_BADGE,
    text: "text-muted-foreground",
  },
  applied: {
    label: "Applied",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    badge: NEUTRAL_BADGE,
    text: "text-muted-foreground",
  },
  interviewing: {
    label: "Interviewing",
    dot: "bg-zinc-700 dark:bg-zinc-200",
    badge: NEUTRAL_BADGE,
    text: "text-foreground",
  },
  offer: {
    label: "Offer",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-rose-500",
    badge: NEUTRAL_BADGE,
    text: "text-muted-foreground",
  },
  ghosted: {
    label: "Ghosted",
    dot: "bg-amber-500",
    badge: NEUTRAL_BADGE,
    text: "text-amber-600 dark:text-amber-500",
  },
}

export const STATUS_ORDER: JobStatus[] = ["wishlist", "applied", "interviewing", "offer", "rejected", "ghosted"]

export const PRIORITY_META: Record<Priority, { label: string; badge: string; dot: string }> = {
  low: {
    label: "Low",
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-zinc-300 dark:bg-zinc-600",
  },
  medium: {
    label: "Medium",
    badge: "bg-muted text-foreground/80 border-border",
    dot: "bg-zinc-400 dark:bg-zinc-500",
  },
  high: {
    label: "High",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    dot: "bg-amber-500",
  },
}

export const SOURCE_LABELS: Record<Source, string> = {
  linkedin: "LinkedIn",
  glints: "Glints",
  pintarnya: "Pintarnya",
  instagram: "Instagram",
  threads: "Threads",
  company: "Company site",
  referral: "Referral",
  email: "Email",
  direct: "Direct",
  other: "Other",
}

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
}

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
}

export const REMINDER_LABELS: Record<ReminderType, string> = {
  followup_recruiter: "Follow up recruiter",
  followup_company: "Follow up company",
  check_application: "Check application",
  interview_prep: "Interview prep",
  custom: "Custom",
}

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone: "Phone",
  video: "Video",
  onsite: "On-site",
  take_home: "Take-home",
  technical: "Technical",
  behavioral: "Behavioral",
  panel: "Panel",
  other: "Other",
}
