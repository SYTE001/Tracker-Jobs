import type { JobStatus, Priority, Source, WorkMode, JobType, ReminderType, InterviewType } from "@/types"

/* Status metadata: label, tailwind accent classes, and semantic tone */
export const STATUS_META: Record<
  JobStatus,
  { label: string; dot: string; badge: string; text: string }
> = {
  wishlist: {
    label: "Wishlist",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    text: "text-slate-600 dark:text-slate-400",
  },
  applied: {
    label: "Applied",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    text: "text-blue-600 dark:text-blue-400",
  },
  interviewing: {
    label: "Interviewing",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-900",
    text: "text-violet-600 dark:text-violet-400",
  },
  offer: {
    label: "Offer",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    text: "text-rose-600 dark:text-rose-400",
  },
  ghosted: {
    label: "Ghosted",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    text: "text-amber-600 dark:text-amber-400",
  },
}

export const STATUS_ORDER: JobStatus[] = ["wishlist", "applied", "interviewing", "offer", "rejected", "ghosted"]

export const PRIORITY_META: Record<Priority, { label: string; badge: string }> = {
  low: {
    label: "Low",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  },
  medium: {
    label: "Medium",
    badge: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900",
  },
  high: {
    label: "High",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900",
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
