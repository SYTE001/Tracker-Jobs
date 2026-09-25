# JobTrack — Job Application Tracker

A local-first job application tracker. Track applications, interviews, follow-ups, offers, and job-search metrics in one place — no spreadsheet required. All data stays in your browser.

JobTrack is built to answer one question at a glance: *what do I need to do next?* Every active application derives a next action, and the dashboard surfaces what is overdue, due today, or coming up.

## Features

- **Overview** — Action-first dashboard: an attention queue (overdue follow-ups, interviews soon, deadlines, needs-action), an inline metric summary, a clickable pipeline strip, and recent activity.
- **Applications** — Dense table with URL-backed filters (bookmarkable/shareable), active filter chips, search, sortable columns, a derived "next action" column, bulk actions with undo, CSV export, density toggle, and a mobile card layout.
- **Board** — Kanban pipeline with drag-and-drop plus an accessible status selector (required on mobile), per-column counts, filters, sort, and density.
- **Application detail** — Sticky header, action bar, next-action panel, a dominant activity timeline, and inline interview & follow-up CRUD.
- **Follow-ups** — Task queue grouped into Overdue / Today / Upcoming with inline complete, reschedule, open, and delete, plus collapsible history and duplicate-reminder warnings.
- **Interviews** — Upcoming / Past / All tabs, a "next interview" block with countdown and join link, and full edit / delete / set-result lifecycle.
- **Saved jobs** — Opportunity inbox with convert-to-application (relationship preserved, double-convert guarded).
- **Companies** — Directory with per-company stats, duplicate detection, and editable company detail.
- **Metrics** — Historical funnel derived from lifecycle events (an app that went Applied → Interviewing → Rejected still counts as interviewed), source performance, response timing, and distributions, with time/source/status filters.
- **Command palette** — `Ctrl`/`Cmd` + `K` global search across applications, companies, saved jobs, interviews, and follow-ups.
- **Data & backup** — Versioned local storage with safe migrations, JSON import/export with validation and merge/replace, CSV export, a guarded reset, and a corrupt-data recovery flow that never masks data loss as an empty account.
- **Theme** — Light, dark, and system themes with `prefers-reduced-motion` support.

## Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + class-variance-authority (near-monochrome "ink" design system)
- **Components**: Radix UI (dialog, dropdown) + custom minimal primitives
- **State**: Zustand with persisted, versioned local storage and safe migrations
- **Validation**: Zod + React Hook Form
- **Drag & drop**: @hello-pangea/dnd
- **Charts**: Recharts (lazy-loaded)

## Scripts

```bash
npm install       # install dependencies
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build
npm run lint      # lint with oxlint
npm run typecheck # type-check only
npm run test      # lint + typecheck
npm run test:smoke  # end-to-end smoke test against the preview (see below)
```

### Running the smoke test

The smoke test drives the production preview with a real browser.

```bash
npm run build
npm run preview -- --port 4173      # in one terminal
PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" npm run test:smoke   # in another
```

`PUPPETEER_EXECUTABLE_PATH` is optional — the test also probes common Chrome/Chromium install locations. Override the target with `SMOKE_BASE_URL`.

## Deployment

Static SPA using `BrowserRouter`. History fallback is preconfigured for Netlify (`public/_redirects`) and Vercel (`vercel.json`); for other hosts, rewrite all routes to `/index.html`.

## Data & privacy

JobTrack is local-first. Your applications, companies, interviews, follow-ups, and settings are persisted only in this browser's local storage. Use **Settings → Data & Backup** to export a full JSON backup or import one on another device. No data is sent to any server.
