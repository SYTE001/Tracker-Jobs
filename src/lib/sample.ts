import type {
  JobTrackDb,
  Application,
  Company,
  ApplicationEvent,
  Reminder,
  Interview,
} from "@/types"
import { uid } from "@/lib/utils"

/** Development/last-resort crude helpers only used to build the sample set. */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
function daysAhead(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
/** yyyy-mm-dd n days in the past (used for reminder/interview date fields). */
function dateAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function buildSampleData(): {
  applications: Application[]
  companies: Company[]
  application_events: ApplicationEvent[]
  reminders: Reminder[]
  interviews: Interview[]
} {
  const companies: Company[] = [
    { id: uid("cmp"), name: "Nusa Tech", industry: "Software", location: "Jakarta", website: "https://nusatech.id", created_at: daysAgo(30) },
    { id: uid("cmp"), name: "Karya Labs", industry: "Fintech", location: "Remote", created_at: daysAgo(28) },
    { id: uid("cmp"), name: "Bumi Energi", industry: "Energy", location: "Bandung", created_at: daysAgo(25) },
    { id: uid("cmp"), name: "Satu Digital", industry: "E-commerce", location: "Surabaya", created_at: daysAgo(22) },
    { id: uid("cmp"), name: "Malaka Ventures", industry: "Startup", location: "Remote", created_at: daysAgo(20) },
  ]
  const [nusa, karya, bumi, satu, malaka] = companies

  // Stable ids so events/reminders/interviews can reference their application.
  const ids = {
    frontend: uid("app"),
    designer: uid("app"),
    analyst: uid("app"),
    intern: uid("app"),
    mobile: uid("app"),
    manager: uid("app"),
  }

  const applications: Application[] = [
    {
      id: ids.frontend,
      company_id: nusa.id,
      job_title: "Senior Frontend Engineer",
      status: "interviewing",
      source: "linkedin",
      job_url: "https://linkedin.com/jobs/1",
      location: "Jakarta",
      work_mode: "hybrid",
      job_type: "full_time",
      applied_date: daysAgo(9),
      deadline: daysAhead(5),
      priority: "high",
      currency: "IDR",
      salary_min: 30000000,
      salary_max: 45000000,
      recruiter_name: "Rani Putri",
      recruiter_contact: "rani@nusatech.id",
      tags: ["frontend", "react"],
      notes: "Second interview with the VP Eng.",
      created_at: daysAgo(9),
      updated_at: daysAgo(1),
      last_activity_at: daysAgo(1),
      archived: false,
    },
    {
      id: ids.designer,
      company_id: karya.id,
      job_title: "Product Designer",
      status: "applied",
      source: "glints",
      job_url: "https://glints.com/jobs/2",
      location: "Remote",
      work_mode: "remote",
      job_type: "full_time",
      applied_date: daysAgo(4),
      salary_min: 20000000,
      salary_max: 28000000,
      tags: ["design"],
      priority: "medium",
      created_at: daysAgo(4),
      updated_at: daysAgo(4),
      last_activity_at: daysAgo(4),
      archived: false,
    },
    {
      id: ids.analyst,
      company_id: bumi.id,
      job_title: "Data Analyst",
      status: "offer",
      source: "company",
      job_url: "https://bumienergi.co.id/careers",
      location: "Bandung",
      work_mode: "onsite",
      job_type: "full_time",
      applied_date: daysAgo(14),
      salary_min: 12000000,
      salary_max: 18000000,
      recruiter_name: "Budi Santoso",
      priority: "high",
      tags: [],
      notes: "Verbal offer received — reviewing package.",
      created_at: daysAgo(14),
      updated_at: daysAgo(2),
      last_activity_at: daysAgo(2),
      archived: false,
    },
    {
      id: ids.intern,
      company_id: satu.id,
      job_title: "Growth Marketing Intern",
      status: "wishlist",
      source: "instagram",
      job_url: "https://instagram.com/p/xyz",
      work_mode: "remote",
      job_type: "internship",
      tags: ["marketing"],
      priority: "low",
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
      last_activity_at: daysAgo(2),
      archived: false,
    },
    {
      id: ids.mobile,
      company_id: malaka.id,
      job_title: "Mobile Engineer (React Native)",
      status: "rejected",
      source: "referral",
      location: "Remote",
      work_mode: "remote",
      job_type: "full_time",
      applied_date: daysAgo(21),
      tags: ["mobile"],
      priority: "medium",
      notes: "Rejected after take-home. Good feedback.",
      created_at: daysAgo(21),
      updated_at: daysAgo(6),
      last_activity_at: daysAgo(6),
      archived: false,
    },
    {
      id: ids.manager,
      company_id: nusa.id,
      job_title: "Engineering Manager",
      status: "ghosted",
      source: "threads",
      location: "Jakarta",
      applied_date: daysAgo(40),
      tags: [],
      priority: "low",
      created_at: daysAgo(40),
      updated_at: daysAgo(18),
      last_activity_at: daysAgo(18),
      archived: false,
    },
  ]

  const ev = (
    application_id: string,
    event_type: ApplicationEvent["event_type"],
    date: string,
    title: string,
    description?: string,
  ): ApplicationEvent => ({
    id: uid("evt"),
    application_id,
    event_type,
    event_date: date,
    title,
    description,
    created_at: date,
  })

  const application_events: ApplicationEvent[] = [
    ev(ids.frontend, "created", daysAgo(9), "Application created"),
    ev(ids.frontend, "status_changed", daysAgo(7), "Moved to Interviewing", "Recruiter screen passed"),
    ev(ids.frontend, "interview_scheduled", daysAgo(1), "Interview scheduled", "Technical round with VP Eng"),
    ev(ids.designer, "created", daysAgo(4), "Application created"),
    ev(ids.analyst, "created", daysAgo(14), "Application created"),
    ev(ids.analyst, "status_changed", daysAgo(3), "Moved to Offer"),
    ev(ids.analyst, "offer_received", daysAgo(2), "Offer received", "Verbal offer — reviewing package"),
    ev(ids.intern, "created", daysAgo(2), "Saved to wishlist"),
    ev(ids.mobile, "created", daysAgo(21), "Application created"),
    ev(ids.mobile, "rejection_received", daysAgo(6), "Rejection received", "After take-home assignment"),
    ev(ids.manager, "created", daysAgo(40), "Application created"),
    ev(ids.manager, "status_changed", daysAgo(18), "Auto-marked as ghosted", "No activity for 21+ days"),
  ]

  const reminders: Reminder[] = [
    // Overdue follow-up — persistent high visibility.
    {
      id: uid("rem"),
      application_id: ids.designer,
      reminder_type: "followup_company",
      reminder_date: dateAgo(2),
      completed: false,
      created_at: daysAgo(4),
    },
    // Due today — interview prep for the upcoming technical round.
    {
      id: uid("rem"),
      application_id: ids.frontend,
      reminder_type: "interview_prep",
      reminder_date: today(),
      completed: false,
      created_at: daysAgo(1),
    },
    // Upcoming — check on the offer decision.
    {
      id: uid("rem"),
      application_id: ids.analyst,
      reminder_type: "check_application",
      reminder_date: daysAhead(2),
      completed: false,
      created_at: daysAgo(2),
    },
  ]

  const interviews: Interview[] = [
    // Upcoming interview.
    {
      id: uid("iv"),
      application_id: ids.frontend,
      stage: "Technical round",
      type: "video",
      date: daysAhead(3),
      start_time: "14:00",
      end_time: "15:00",
      interviewer: "Andi Wijaya (VP Eng)",
      meeting_url: "https://meet.google.com/abc-defg-hij",
      notes: "Prepare system design + React deep dive.",
      created_at: daysAgo(1),
    },
    // Past interview kept as history.
    {
      id: uid("iv"),
      application_id: ids.frontend,
      stage: "Recruiter screen",
      type: "phone",
      date: dateAgo(7),
      interviewer: "Rani Putri",
      result: "Passed",
      created_at: daysAgo(7),
    },
  ]

  return { applications, companies, application_events, reminders, interviews }
}

export function emptyDb(): JobTrackDb {
  return {
    meta: { version: 3 },
    settings: {
      theme: "system",
      ghosted_threshold_days: 21,
      auto_mark_ghosted: true,
      default_status: "applied",
      default_priority: "medium",
      default_view: "overview",
      reduced_motion: false,
      currency: "IDR",
    },
    applications: [],
    companies: [],
    application_events: [],
    reminders: [],
    interviews: [],
    saved_jobs: [],
  }
}
