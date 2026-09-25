# JobTrack — Job Application Tracker

A local-first job application tracker. Track applications, interviews, follow-ups, offers, and job-search metrics in one place — no spreadsheet required. All data stays in your browser.

## Features

- **Board** — Kanban pipeline with drag-and-drop and an accessible status selector fallback.
- **Applications** — Sortable, filterable table with search, bulk actions, CSV export, and mobile card layout.
- **Overview** — Actionable dashboard: KPIs, follow-ups due, upcoming interviews, and recent activity.
- **Interviews & follow-ups** — Schedule, complete, and reschedule reminders; track interview stages and history.
- **Saved jobs** — Wishlist opportunities and convert them into applications.
- **Companies** — Directory with per-company application stats and duplicate prevention.
- **Metrics** — Conversion funnel, source performance, and response-timing analytics derived from real data.
- **Data & backup** — Versioned local storage, JSON import/export, CSV export, and a guarded reset.
- **Command palette** — `Ctrl`/`Cmd` + `K` for quick navigation and adding jobs.
- **Theme** — Light, dark, and system themes with `prefers-reduced-motion` support.

## Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + class-variance-authority
- **Components**: Radix UI + custom minimal primitives
- **State**: Zustand with persisted, versioned local storage and safe migrations
- **Validation**: Zod + React Hook Form
- **Drag & drop**: @hello-pangea/dnd
- **Charts**: Recharts (lazy-loaded)

## Run locally

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # lint with oxlint
```

## Data & privacy

JobTrack is local-first. Your applications, companies, interviews, follow-ups, and settings are persisted only in this browser's local storage. Use **Settings → Data & Backup** to export a full JSON backup or import one on another device. No data is sent to any server.
