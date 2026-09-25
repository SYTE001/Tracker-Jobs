# Tracker-Jobs — Product Requirements Document

Status: Build Blueprint
Target: Production / Ready-to-Live
Product: JobTrack / Tracker-Jobs
Repo: SYTE001/Tracker-Jobs
Architecture strategy: Build → Design → Optimize → Final Audit
Development rule: Do NOT perform a full production audit during feature implementation. Validate locally only for the feature currently being built. Perform the comprehensive audit after all feature, UX, performance, and deployment work is complete.

---

## 1. Product Definition

Tracker-Jobs is a personal job-application operating system for people who apply through multiple channels and need one reliable place to track applications, interviews, follow-ups, offers, rejections, deadlines, notes, and job-search metrics.

The product must feel like a focused productivity tool, not a generic admin dashboard.

Primary user outcome:

> “I can see every job I care about, know what needs action next, and understand how my job search is performing without maintaining a spreadsheet.”

Supported application sources include:
LinkedIn, Glints, Pintarnya, Instagram, Threads, company career pages, referrals, email, and direct applications.

Core product loop:

Discover / save job → add to Tracker → track status → record events → follow up → interview → offer / rejection → review metrics → improve job search.

---

## 2. Current Repository Baseline

The current repository is a React 19 + TypeScript + Vite application using Tailwind CSS v4, Zustand, Zod, React Hook Form, Radix UI, Lucide, date-fns, Recharts, and @hello-pangea/dnd.

Existing implementation already contains:

- Responsive application shell
- Sidebar + top bar
- Dark mode state
- Kanban board
- Add Application modal
- Drag-and-drop status changes
- Zustand local persistence
- Zod application/company schemas
- Legacy local-storage compatibility
- Ghosted application detection
- Relational schema reference in `schema.sql`
- Placeholder routes for List View, Metrics, and Companies
- Legacy implementation under `/legacy`

Important baseline gap:

The current product is a functional Kanban prototype, not a complete production application. The PRD below defines the target system and the implementation order.

---

## 3. Product Goals

### P0 — Must ship

1. Add, edit, archive, delete, and view job applications.
2. Kanban workflow with reliable status transitions.
3. List/table workflow for fast scanning.
4. Application detail view with timeline and follow-up data.
5. Dashboard with actionable job-search overview.
6. Search, filters, sorting, and saved views.
7. Interview and follow-up tracking.
8. Reminders and overdue states.
9. Companies directory.
10. Job-source tracking.
11. Notes, tags, salary, location, work mode, job type, resume, cover letter, URL.
12. Data import/export and local backup.
13. Persistent theme preferences.
14. Responsive mobile and desktop experience.
15. Empty/loading/error/success states.
16. Accessibility and keyboard interactions.
17. Production build stability and deployment readiness.

### P1 — Important

1. Saved jobs / wishlist.
2. Application activity timeline.
3. Duplicate detection.
4. Company normalization.
5. Smart ghosted detection.
6. Quick-add flow.
7. Global command/search palette.
8. Metrics and conversion analytics.
9. Calendar-style deadline/follow-up view.
10. Bulk actions.
11. Undo for destructive actions.
12. Onboarding sample data option.

### P2 — Later

1. Cloud account sync.
2. Multi-device synchronization.
3. Authentication.
4. Email/calendar integrations.
5. Browser extension.
6. AI-assisted job parsing / resume matching.
7. Automated reminders through external channels.

Do not block the production launch on P2.

---

## 4. Core User Personas

### Persona A — Active Applicant

Applies to many jobs every week across LinkedIn, company websites, and social media. Needs speed and minimal data entry.

Primary tasks:
Add application, change status, check next action, follow up, open job URL.

### Persona B — Organized Applicant

Tracks interviews, recruiters, resumes, notes, deadlines, and salary details.

Primary tasks:
Maintain detailed records, view timeline, schedule follow-ups, compare companies.

### Persona C — Data-driven Applicant

Wants to know application volume, interview rate, source performance, rejection rate, and response behavior.

Primary tasks:
Metrics, filters by time/source/status, review trends.

---

## 5. Information Architecture

Primary navigation:

- Overview
- Applications
- Board
- Saved Jobs
- Interviews
- Follow-ups
- Companies
- Metrics

Secondary navigation:

- Settings
- Data / Backup
- Keyboard Shortcuts
- About

Mobile navigation:

- Overview
- Applications
- Add
- Board
- More

The current Sidebar labels must be upgraded from static buttons into real router-backed navigation.

---

## 6. Application Lifecycle

Canonical statuses:

1. Wishlist
2. Applied
3. Interviewing
4. Offer
5. Rejected
6. Ghosted

Rules:

- Wishlist = opportunity saved but not yet submitted.
- Applied = application submitted and awaiting outcome.
- Interviewing = at least one active interview stage.
- Offer = offer received.
- Rejected = explicit rejection.
- Ghosted = no meaningful response/activity after configured threshold.
- User must always be able to manually override status.
- Status changes must create an application event.
- Moving a card between Kanban columns must update status and append an event.

Do not silently overwrite history.

---

## 7. Primary User Flow

### First visit

1. Load application.
2. Read persisted data.
3. If first run, show lightweight onboarding.
4. User chooses:
   - Start empty
   - Load sample jobs
5. Land on Overview.

Onboarding must be dismissible and never trap the user.

### Add a job

Entry points:

- Topbar “Add Job”
- Overview quick action
- Applications page
- Board page
- Keyboard shortcut

Fast-add required fields:

- Job title
- Company
- Status

Optional fields:

- URL
- Source
- Location
- Work mode
- Job type
- Applied date
- Salary
- Priority
- Tags
- Notes

After save:

- Close modal/drawer.
- Show success toast.
- Add event `created`.
- Navigate nowhere by default.
- Offer “Open details” as secondary action.

### View details

Clicking a job opens a detail drawer on desktop and full-screen sheet/page on mobile.

Detail sections:

- Header
- Job metadata
- Status
- Timeline
- Next action
- Follow-up
- Interview details
- Compensation
- Documents
- Notes
- Source
- Links
- Activity history

### Change status

Every status transition must:

1. Update application.
2. Add timeline event.
3. Update derived metrics.
4. Preserve previous events.
5. Provide visual confirmation.

### Follow-up flow

1. User chooses “Schedule follow-up”.
2. Selects date and reminder type.
3. Reminder becomes visible in Overview and Follow-ups.
4. Reminder can be completed, rescheduled, or deleted.
5. Overdue reminder is visually distinct.
6. Completing a reminder records an event.

### Interview flow

1. User opens application.
2. Adds interview event.
3. Sets interview stage/type/date.
4. Optionally adds interviewer, meeting URL, notes.
5. Interview appears in application timeline and Interviews view.
6. Past interviews remain historical.

---

## 8. Overview / Dashboard

Purpose: answer “What needs my attention right now?”

Layout:

Top area:
- Page title
- Current date
- Add Job
- Search / command action

Summary row:
- Total Applications
- Active
- Interviews
- Offers
- Follow-ups Due

Action area:
- Follow-ups due today
- Interviews upcoming
- Overdue actions
- Recently updated applications

Main visual:
- Status distribution
- Applications over time
- Source performance
- Recent activity

Dashboard must prioritize actionable information over decorative charts.

Required dashboard interactions:

- Clicking a metric filters Applications.
- Clicking a reminder opens the relevant application.
- Clicking a status segment filters by status.
- “View all” links to the correct page.

Avoid excessive card grids.

---

## 9. Board View

The existing Kanban becomes a production workflow.

Columns:

Wishlist | Applied | Interviewing | Offer | Rejected | Ghosted

Requirements:

- Drag-and-drop.
- Accessible alternative status selector.
- Column counts.
- Horizontal scrolling on desktop.
- Mobile status selector instead of requiring drag-and-drop.
- Card context menu.
- Quick edit.
- Open details.
- External job URL.
- Priority indicator.
- Next follow-up indicator.
- Interview indicator.
- Company identity.
- Last activity.
- Optional salary.

Board controls:

- Search
- Status filter
- Source filter
- Priority filter
- Work mode filter
- Date filter
- Sort
- Compact / comfortable density

Do not allow visual density to collapse readability.

---

## 10. Applications List View

Purpose: high-density management.

Table columns:

- Job
- Company
- Status
- Applied
- Source
- Location
- Work mode
- Priority
- Next action
- Updated
- Actions

Requirements:

- Sortable columns.
- Search.
- Multi-filter.
- Pagination or virtualization when dataset becomes large.
- Multi-select.
- Bulk status change.
- Bulk archive/delete.
- Export selected.
- Column visibility.
- Mobile responsive card representation.

Empty list must provide “Add your first job”.

---

## 11. Application Detail Model

Required logical object:

Application

Suggested fields:

- id
- company_id
- job_title
- status
- source
- job_url
- location
- work_mode
- job_type
- applied_date
- deadline
- salary_min
- salary_max
- currency
- priority
- recruiter_name
- recruiter_contact
- notes
- job_description
- requirements
- interview_details
- resume_used
- cover_letter_used
- tags
- archived
- created_at
- updated_at

Derived values:

- days_since_applied
- days_since_update
- next_followup
- overdue
- upcoming_interview
- active
- response_duration
- current_status_duration

Do not persist derived values unless required for performance.

---

## 12. Application Events

Every meaningful lifecycle change becomes an immutable event.

Event examples:

- created
- status_changed
- note_added
- interview_scheduled
- interview_completed
- followup_scheduled
- followup_completed
- recruiter_contacted
- recruiter_replied
- offer_received
- rejection_received
- archived
- restored

Event schema:

- id
- application_id
- event_type
- event_date
- title
- description
- metadata
- created_at

Timeline must be chronological and readable.

---

## 13. Follow-ups and Reminders

Reminder fields:

- id
- application_id
- reminder_type
- reminder_date
- completed
- created_at

Reminder types:

- Follow up recruiter
- Follow up company
- Check application
- Interview preparation
- Custom

Rules:

- Today = high visibility.
- Overdue = persistent visibility until completed/rescheduled.
- Completed = hidden from active reminders but retained in history.
- Reminder date must be validated.
- Completing a reminder creates an event.

For the local-first MVP, reminders are in-app. Browser notification support is optional and must not become a dependency for core functionality.

---

## 14. Interviews

Interview record should support:

- Application
- Stage
- Type
- Date
- Start time
- End time
- Interviewer
- Meeting URL
- Location
- Notes
- Result
- Follow-up date

Views:

- Upcoming
- Past
- By application

Interview cards must link back to the application.

---

## 15. Saved Jobs

Saved job record:

- id
- company_id
- job_title
- source
- URL
- salary range
- deadline
- priority
- notes
- status
- application_id
- created_at
- updated_at

Actions:

- Open URL
- Edit
- Convert to application
- Archive
- Delete

Conversion must preserve the relationship between saved job and application.

---

## 16. Companies

Companies page:

- Search companies
- Company cards / table
- Application count
- Active applications
- Interviews
- Offers
- Website
- Industry
- Location

Company detail:

- Overview
- All applications
- Hiring outcomes
- Notes
- Links

Company creation rules:

- Normalize company names.
- Reuse an existing company when name matches.
- Do not create duplicates every time the user adds a job.
- Allow manual merge later.

Company logos:

- External logo fetching must never be a hard dependency.
- Always provide initials fallback.
- Handle network failure without layout shift.
- Prefer a safe configurable logo provider.
- Do not expose unnecessary third-party requests.

---

## 17. Search

Global search must search:

- Job title
- Company name
- Notes
- Recruiter
- Source
- Location
- Tags

Behavior:

- Instant local filtering for small datasets.
- Debounced search for larger datasets.
- Highlight matching terms where useful.
- Empty query returns recent/relevant records.
- Keyboard shortcut opens command search.

Suggested shortcut:

- Ctrl/Cmd + K

---

## 18. Filters

Global filter dimensions:

- Status
- Source
- Priority
- Work mode
- Job type
- Company
- Date applied
- Follow-up due
- Interview upcoming
- Tags
- Archived state

Filter state should be represented in the URL where appropriate so filtered pages can be bookmarked/shared.

Provide “Clear all”.

---

## 19. Metrics

Metrics must be factual calculations from stored application data.

Required:

- Total applications
- Applications per week/month
- Active applications
- Interview count
- Offer count
- Rejection count
- Ghosted count
- Interview rate
- Offer rate
- Rejection rate
- Response rate
- Average time to first response
- Applications by source
- Applications by status
- Applications by work mode
- Salary range distribution when data exists

Do not display percentages when denominator is zero.

Charts must answer questions, not merely decorate the dashboard.

Examples:

“What source generates the most interviews?”

“How many applications did I send this month?”

“How long do companies take to respond?”

---

## 20. Design System

Visual direction:

- Minimal productivity application.
- Apple-like restraint.
- High information density without visual clutter.
- Strong typography hierarchy.
- Neutral surfaces.
- One restrained accent color.
- Subtle borders.
- Minimal shadows.
- No gratuitous gradients.
- No neon.
- No oversized decorative illustrations.
- No fake AI-generated copy.
- No unnecessary glassmorphism.
- No excessive rounded cards.

Color usage:

- Neutral base surfaces.
- Accent only for primary actions and important focus states.
- Semantic colors reserved for statuses.
- Maintain AA contrast at minimum; target stronger contrast where feasible.

Typography:

- Use a modern system/UI font stack or Inter-style stack.
- Clear numeric typography for metrics.
- Avoid too many font weights.

Spacing:

- Use a consistent spacing scale.
- Prefer 4/8px rhythm.
- Avoid arbitrary one-off spacing.

Radius:

- Small to medium radius.
- Avoid extremely rounded “SaaS template” components.

Motion:

- 120–220ms for micro-interactions.
- No decorative animation loops.
- Respect `prefers-reduced-motion`.

---

## 21. Layout Requirements

Desktop:

- Persistent sidebar.
- Sticky topbar.
- Content max-width where useful.
- Kanban can use full available width.
- Detail drawer overlays without destroying board context.

Tablet:

- Collapsible sidebar.
- Dense list/table layout.
- Board remains horizontally scrollable.

Mobile:

- Bottom navigation or compact mobile navigation.
- Detail view becomes full-screen.
- Add Job becomes bottom sheet/full-screen sheet.
- Table converts to cards.
- Drag-and-drop is not mandatory; use status controls.
- Touch targets at least ~44px.
- No horizontal page overflow except intentional Kanban scrolling.

---

## 22. Component Architecture

Suggested structure:

src/
  app/
  components/
    ui/
    layout/
  features/
    overview/
    applications/
    board/
    saved-jobs/
    interviews/
    followups/
    companies/
    metrics/
    settings/
  store/
  hooks/
  lib/
    dates/
    validation/
    search/
    export/
    import/
  types/
  routes/

Rules:

- Keep feature logic inside feature folders.
- Keep reusable UI primitives separate.
- Avoid giant components.
- Avoid duplicating business logic across pages.
- Keep schemas close to domain types or a dedicated validation module.
- Derived selectors belong in store selectors/hooks rather than random components.

---

## 23. State Management

Zustand remains acceptable for local-first architecture.

Required improvements:

- Centralize actions.
- Centralize selectors.
- Separate domain data from UI state.
- Add versioned migrations.
- Add safe hydration.
- Handle corrupt local storage gracefully.
- Avoid unnecessary global re-renders.
- Do not store transient modal state globally unless required.
- Keep derived metrics as selectors.

Persist:

- Applications
- Companies
- Events
- Saved jobs
- Reminders
- Interviews
- Settings

Do not persist:

- Modal open state
- Temporary form state
- Drag state
- Hover state
- Loading indicators

---

## 24. Data Validation

Use Zod as the single source for runtime validation.

Validation requirements:

- Required job title.
- Required company.
- Valid URLs where supplied.
- Valid dates.
- Salary min <= salary max.
- No invalid status values.
- No invalid foreign-key relationships.
- Safe string lengths.
- Tags normalized.
- Contact fields validated where appropriate.

On imported data:

- Validate each record.
- Report invalid rows.
- Preserve valid records.
- Never crash the entire application because one imported record is malformed.

---

## 25. Local Data and Backup

MVP must remain fully usable without a backend.

Required:

- Persistent local storage.
- Versioned storage schema.
- Automatic migration.
- Manual JSON export.
- JSON import.
- CSV export for applications.
- Full reset option with confirmation.
- “Last saved” / local data status where useful.

Export format must contain:

- schema version
- export timestamp
- meta/settings
- applications
- companies
- events
- reminders
- saved jobs
- interviews

Import flow:

1. Select file.
2. Parse.
3. Validate.
4. Preview counts.
5. Detect conflicts.
6. Confirm merge or replace.
7. Write data.
8. Show result summary.

Never silently overwrite user data.

---

## 26. Optional Cloud Readiness

Architecture should not block future Supabase/cloud synchronization.

Keep a data-access abstraction so UI components do not directly depend on localStorage.

Example conceptual interface:

Repository:
- list
- get
- create
- update
- delete
- bulkUpdate

Current implementation:
Local repository.

Future implementation:
Supabase repository.

Do not implement cloud sync in the MVP unless needed.

---

## 27. Accessibility

Required:

- Keyboard navigable interface.
- Visible focus states.
- Semantic buttons/links/forms.
- Labels for all inputs.
- Dialog focus management.
- Escape closes dialogs/sheets.
- Screen-reader meaningful names.
- Status changes not represented by color alone.
- Reduced-motion support.
- Error messages associated with fields.
- Drag-and-drop has a non-drag fallback.

Test at minimum:

- Keyboard-only navigation.
- Screen-reader semantics for core flows.
- Zoom/layout around 200%.
- Mobile touch interaction.

---

## 28. Error Handling

Never expose raw errors to users.

Required states:

- Initial loading
- Empty data
- Empty filtered results
- Network/logo failure
- Corrupt local data
- Invalid import
- Save failure
- Delete confirmation
- Undo action
- Route not found
- Browser storage unavailable/full

User-facing error format:

Clear problem → likely cause → direct action.

Example:

“Couldn’t import this file. 3 records contain invalid dates. Review the import report and try again.”

---

## 29. Notifications and Toasts

Use notifications sparingly.

Success:

- “Application added”
- “Status updated”
- “Reminder completed”

Warning:

- “This job is overdue for follow-up”

Danger:

- “Delete application?” with explicit confirmation

Do not show a toast for every background calculation.

---

## 30. Destructive Actions

Delete, reset, replace import, bulk delete:

- Require deliberate confirmation.
- State exactly what will be lost.
- Support undo where technically safe.
- Prefer archive for applications over immediate hard delete.
- Keep hard delete available in an advanced action.

---

## 31. Settings

Settings sections:

Appearance:
- Theme: Light / Dark / System

Behavior:
- Ghosted threshold
- Default status
- Default priority
- Default view

Data:
- Export
- Import
- Reset
- Storage information

Accessibility:
- Reduced motion preference if not inherited automatically

About:
- Version
- Repository
- Product information

---

## 32. Ghosted Logic

Existing prototype marks applications as ghosted after 21 days based on `updated_at`.

Production behavior:

- Make threshold configurable.
- Default threshold: 21 days.
- Base detection on meaningful lifecycle activity, not arbitrary UI edits.
- Never overwrite `offer`, `rejected`, or archived records.
- Prefer an “Auto-mark as ghosted” setting.
- If enabled, mark once and create an event.
- Allow manual restoration to Applied / Interviewing.
- Show why the job was marked ghosted.

Important:

Editing a note or changing a cosmetic field should not incorrectly reset the ghosted timer. Use a dedicated activity timestamp or last meaningful response/activity field.

---

## 33. Quick Actions

Required shortcuts/actions:

- Add Job
- Search
- Edit selected job
- Change status
- Schedule follow-up
- Open job URL
- Archive
- Undo

Keyboard:

- Cmd/Ctrl + K = command search
- N = new application
- / = focus search where compatible
- Esc = close active overlay

Do not conflict with normal text input behavior.

---

## 34. Data Relationships

Company 1 → N Applications

Application 1 → N Events

Application 1 → N Reminders

Application 1 → N Interviews

Saved Job 0..1 → Application

Foreign-key references must remain valid after deletes.

When a company is deleted:

- Prefer soft delete / prevention if applications depend on it.
- Never accidentally destroy applications from a company management action.

---

## 35. Performance Targets

Production target:

- Fast first render on normal desktop/mobile hardware.
- Avoid blocking main thread with expensive derived calculations.
- Avoid rendering all heavy detail content simultaneously.
- Lazy-load secondary routes.
- Lazy-load charts.
- Avoid unnecessary image requests.
- Use memoized selectors for large collections.
- Avoid O(n × m) repeated lookups inside lists.
- Build company lookup maps for repeated relationships.
- Virtualize large lists if dataset size warrants it.

Practical goals:

- No obvious UI lag with hundreds of applications.
- Smooth Kanban interactions.
- No visible layout jump when company logos fail.
- Search remains responsive during typing.
- Initial app shell appears before secondary analytics.

Do not optimize prematurely. Apply full performance optimization in the Optimize phase after core features are complete.

---

## 36. Security and Privacy

This application stores potentially sensitive job-search information.

Requirements:

- Do not hardcode secrets.
- Do not ship server keys to browser code.
- Sanitize external URLs.
- Use `noopener,noreferrer` for external links.
- Avoid third-party data calls unless necessary.
- Do not log personal notes, recruiter contacts, or exported data.
- Clearly communicate that local data stays in browser storage in the local-first MVP.
- If cloud sync is added later, enforce authenticated row-level access.

---

## 37. SEO / Metadata

Even though the primary product is an app, production baseline should include:

- Proper document title.
- Product description.
- Favicon.
- Theme color.
- Open Graph metadata where relevant.
- No accidental React/Vite starter metadata.
- No starter assets unless intentionally used.

Suggested product title:

“JobTrack — Job Application Tracker”

---

## 38. PWA / Offline

PWA is optional for MVP but architecture should not prevent it.

If implemented:

- App shell cache.
- Offline indicator.
- Reliable local data access.
- Installable metadata.
- No stale external dependencies that break offline use.

Do not add a service worker solely for marketing purposes.

---

## 39. Analytics

Do not add invasive analytics by default.

If analytics is required later:

- Privacy-conscious.
- No job content collection.
- No notes or recruiter details.
- Track product events only.

Useful events:

- application_created
- application_status_changed
- application_archived
- followup_completed
- interview_added
- export_completed
- import_completed

---

## 40. Empty States

Every page needs an intentional empty state.

Overview:
“You have no applications yet.”

Applications:
“Start tracking your job search.”

Board:
“Your pipeline is empty.”

Saved Jobs:
“Save opportunities here before applying.”

Interviews:
“No upcoming interviews.”

Follow-ups:
“You’re all caught up.”

Companies:
“Companies appear here as you add jobs.”

Metrics:
“Add a few applications to unlock useful metrics.”

Each empty state needs a primary action.

---

## 41. Responsive UX Rules

Never:

- Allow critical controls to disappear below the fold.
- Depend on hover for essential functionality.
- Use tiny text for metadata.
- Require drag-and-drop on mobile.
- Put too many actions in a cramped row.

Use:

- Bottom sheets
- Full-screen mobile detail
- Sticky action bars where useful
- Scrollable filter rows
- Touch-safe targets
- Mobile-friendly date/time controls

---

## 42. Route Map

Recommended routes:

/
  redirect → /overview

/overview

/applications

/applications/:id

/board

/saved

/interviews

/followups

/companies

/companies/:id

/metrics

/settings

/settings/data

/settings/appearance

Do not use route placeholders once their navigation item is visible.

---

## 43. Implementation Phases

### Phase 0 — Foundation

Goal:
Clean the prototype structure before feature expansion.

Tasks:

- Remove/avoid Vite starter remnants.
- Define domain types.
- Define route structure.
- Define state architecture.
- Define validation schemas.
- Define UI tokens.
- Define reusable components.
- Define repository/data abstraction.
- Define storage migration versioning.

Output:
Stable foundation.

Do not perform full audit.

### Phase 1 — Core Application Management

Build:

- Add application
- Edit application
- Delete/archive
- Application detail
- Company creation/reuse
- Status transitions
- Event timeline
- URL/source fields
- Tags
- Priority

Acceptance:
A user can fully manage a job record without editing raw storage.

### Phase 2 — Board

Build:

- Production Kanban
- Drag-and-drop
- Status fallback selector
- Card menu
- Card indicators
- Mobile behavior
- Filters
- Sort
- Search integration

Acceptance:
Board works smoothly for the complete application lifecycle.

### Phase 3 — Applications List

Build:

- Table
- Search
- Filtering
- Sorting
- Bulk actions
- Archive
- Export
- Mobile cards

Acceptance:
User can manage dozens/hundreds of applications efficiently.

### Phase 4 — Overview

Build:

- KPIs
- Action-needed section
- Follow-ups due
- Upcoming interviews
- Recent activity
- Useful metrics/charts

Acceptance:
Overview answers what requires attention without opening another page.

### Phase 5 — Follow-ups + Interviews

Build:

- Reminder system
- Follow-up page
- Interview page
- Interview records
- Timeline integration
- Complete/reschedule workflows

Acceptance:
No upcoming action can be easily forgotten inside the app.

### Phase 6 — Saved Jobs

Build:

- Saved job CRUD
- Convert to application
- Link relationship
- Saved job filters

### Phase 7 — Companies

Build:

- Company directory
- Company details
- Related applications
- Company statistics
- Duplicate prevention
- Logo fallback

### Phase 8 — Metrics

Build:

- Time range filter
- Source analysis
- Funnel metrics
- Response timing
- Status trends
- Conversion rates

### Phase 9 — Data / Settings

Build:

- Theme system
- Ghosted settings
- Export JSON
- Import JSON
- CSV export
- Data reset
- Storage versioning
- Migration UX

### Phase 10 — Design System Pass

Do not redesign feature-by-feature forever.

Perform one cohesive product design pass:

- Typography
- Colors
- Spacing
- Radius
- Shadows
- Components
- Tables
- Forms
- Dialogs
- Sheets
- Navigation
- Empty states
- Mobile
- Dark mode

Remove:

- Generic AI/SaaS visual patterns
- Excessive rounded cards
- Unnecessary gradients
- Excessive shadows
- Inconsistent spacing
- Duplicate components
- Placeholder copy
- Vite starter visual remnants

### Phase 11 — Optimize

Optimize after all functional features are implemented.

Focus:

- Bundle size
- Route splitting
- React render cost
- Store selectors
- Search performance
- Large list performance
- Image loading
- Chart loading
- Storage performance
- Mobile responsiveness
- Accessibility performance
- Core Web Vitals where measurable

Do not rewrite stable architecture without measurable benefit.

### Phase 12 — FINAL AUDIT

This is the first comprehensive audit.

Audit categories:

Functional:
- Every route works.
- Every primary action works.
- CRUD consistency.
- Data relationships.
- Timeline correctness.
- Status logic.
- Reminder logic.
- Import/export integrity.

UI:
- Desktop
- Tablet
- Mobile
- Light mode
- Dark mode
- Empty states
- Error states
- Loading states
- Overflow
- Typography consistency

Accessibility:
- Keyboard
- Focus
- Labels
- Dialog semantics
- Contrast
- Reduced motion
- Touch target size

Performance:
- Build size
- Rendering
- Search
- Large dataset behavior
- Images
- Charts
- Storage operations

Security/privacy:
- External links
- Secret exposure
- Console logging
- Data handling
- Third-party calls

Code quality:
- TypeScript errors
- lint
- dead files
- dead dependencies
- duplicated logic
- unused starter assets
- inconsistent naming

Production:
- Environment configuration
- Build
- Preview
- 404 handling
- SPA routing
- favicon
- metadata
- deployment configuration
- README
- version

Only after this phase should the project be considered Release Candidate.

---

## 44. Definition of Done — Feature Level

A feature is complete only when:

- UI exists.
- State exists.
- Validation exists.
- Error state exists.
- Empty state exists if applicable.
- Mobile behavior exists.
- Dark mode works.
- Keyboard behavior works where applicable.
- No dummy/static data remains in that feature.
- No console errors.
- Feature survives refresh when data should persist.
- Related timeline/metrics are updated when relevant.

Do not mark a feature done because the screen visually exists.

---

## 45. Definition of Done — Production

Release candidate requires:

- `npm run build` succeeds.
- `npm run lint` succeeds.
- No TypeScript errors.
- No broken routes.
- No starter/demo content.
- No fake buttons.
- No dead navigation items.
- No critical console errors.
- Data survives refresh.
- Export/import works.
- Mobile works.
- Dark mode works.
- Application CRUD works.
- Board/list/detail stay synchronized.
- Metrics derive from real data.
- Reminders and interviews work.
- External links are safe.
- Storage corruption does not brick the app.
- Production deployment tested from a clean browser session.

---

## 46. Testing Strategy

Minimum testing coverage should exist for:

Core actions:
- Create application
- Edit application
- Change status
- Delete/archive
- Add company
- Add event
- Add reminder
- Complete reminder
- Add interview
- Export
- Import

Edge cases:
- Empty database
- Duplicate company
- Invalid URL
- Invalid dates
- Missing optional values
- Corrupt imported data
- Large dataset
- Refresh after mutation
- Dark mode reload
- Mobile viewport
- Browser storage unavailable

Regression smoke test:

1. Open app.
2. Create company.
3. Add job.
4. Edit job.
5. Move job across statuses.
6. Add interview.
7. Schedule follow-up.
8. Complete follow-up.
9. Open detail.
10. Export.
11. Refresh.
12. Import backup.
13. Verify records.

---

## 47. Seed Data

Development-only seed dataset should cover:

- Multiple companies
- Every status
- Multiple sources
- Different priorities
- Upcoming interview
- Overdue follow-up
- Missing logo
- Long job title
- Long company name
- Missing salary
- Salary range
- Remote/hybrid/onsite
- Multiple tags
- Archived application

Do not ship fake seed data into a fresh production user's account unless explicitly enabled during onboarding.

---

## 48. Copy Guidelines

UI copy should be:

- Clear
- Short
- Specific
- Action-oriented

Avoid:

- “Supercharge your productivity”
- “Unlock your potential”
- “Revolutionize your workflow”
- Generic AI marketing copy

Prefer:

- “Add application”
- “Schedule follow-up”
- “No interviews yet”
- “You have 3 follow-ups due today”

---

## 49. Anti-Slop Rules

Never introduce:

- Purple AI gradients
- Excessive glassmorphism
- Giant gradient hero sections
- Decorative dashboard charts with no informational value
- 10+ cards for simple data
- Fake testimonials
- Fake usage counters
- Unnecessary badges
- Excessive emoji
- Random illustrations
- Artificial “AI-powered” labels
- Generic SaaS landing-page patterns inside the product

Every visual element must support navigation, hierarchy, comprehension, or feedback.

---

## 50. Migration / Legacy Rules

The repository contains a `legacy` implementation and a legacy local-storage compatibility path.

During development:

- Preserve data migration until production storage is stable.
- Do not blindly delete legacy parsing.
- Define an explicit migration version.
- Test old data against the new schema.
- Once migration is verified and no longer needed, remove obsolete compatibility code in a deliberate cleanup step.

Never mix two competing domain models indefinitely.

---

## 51. Recommended Technical Improvements

Current schema contains fields that are not yet fully represented by the TypeScript application model. Align domain types with the production schema.

Required consistency:

- interviews must have a first-class model.
- reminders must have a first-class model.
- attachments must have a defined model or be explicitly deferred.
- company logo should be represented consistently.
- archived state must be explicit.
- currency must be defined consistently.
- event metadata should be typed.

Avoid storing arbitrary `any` for core persisted domain collections.

---

## 52. Dependency Rules

Before adding a dependency:

1. Check whether existing libraries already solve the need.
2. Prefer browser APIs for trivial functionality.
3. Avoid libraries for one small helper.
4. Keep bundle cost in mind.
5. Remove unused dependencies during final audit.

Do not replace working dependencies simply for novelty.

---

## 53. Agent Development Rules

When an AI coding agent implements this PRD:

1. Read this PRD first.
2. Inspect existing architecture before changing it.
3. Work phase-by-phase.
4. Do not jump directly to unrelated features.
5. Reuse existing components where valid.
6. Remove obsolete code when replacing behavior.
7. Keep the app runnable after each coherent feature batch.
8. Do not generate fake data to mask missing backend/state behavior.
9. Do not leave visible placeholder buttons or dead routes.
10. Do not perform a full project audit after every small change.
11. Keep a concise implementation log / TODO state.
12. At the end of each phase, verify only that phase plus basic build/lint smoke checks.
13. Reserve the full cross-project audit for Phase 12.

If implementation conflicts with this PRD, prefer the PRD unless the existing repository contains a deliberate architectural constraint. Record the deviation.

---

## 54. Agent Working Order

For every implementation batch:

### Step A — Understand
Read relevant files and determine the smallest set of changes.

### Step B — Build
Implement the complete behavior, not only the visual shell.

### Step C — Connect
Wire state, routing, persistence, validation, and dependent views.

### Step D — Polish
Handle responsive behavior, loading, empty, error, and success states for the feature.

### Step E — Smoke Check
Run the smallest relevant build/lint/type checks.

### Step F — Continue
Move to the next unfinished feature.

Do not stop at “looks good” while functionality remains dummy/static.

---

## 55. Final Release Checklist

### Product
- [ ] All P0 features complete
- [ ] Critical P1 features complete
- [ ] No dead navigation
- [ ] No fake buttons
- [ ] No placeholder screens
- [ ] No broken flows

### Data
- [ ] Persistent
- [ ] Versioned
- [ ] Importable
- [ ] Exportable
- [ ] Recoverable
- [ ] Validated

### UX
- [ ] Desktop
- [ ] Tablet
- [ ] Mobile
- [ ] Light
- [ ] Dark
- [ ] Empty
- [ ] Loading
- [ ] Error
- [ ] Success
- [ ] Accessible

### Performance
- [ ] Bundle checked
- [ ] Route splitting checked
- [ ] Large lists tested
- [ ] Search tested
- [ ] Store re-renders checked
- [ ] Image behavior checked
- [ ] Charts optimized

### Code
- [ ] TypeScript clean
- [ ] Lint clean
- [ ] Dead code removed
- [ ] Starter assets removed
- [ ] Legacy compatibility intentionally handled
- [ ] Dependencies reviewed

### Production
- [ ] Production build works
- [ ] Deployment works
- [ ] SPA fallback works
- [ ] Metadata correct
- [ ] Favicon correct
- [ ] README updated
- [ ] Clean-browser smoke test passes

---

## 56. Release Definition

Tracker-Jobs is ready to live when a first-time user can:

1. Open the app.
2. Add several applications in under a few minutes.
3. See them immediately in Overview, Applications, and Board.
4. Change status without losing history.
5. Add interviews and follow-ups.
6. Know what action is due today.
7. Search/filter the dataset quickly.
8. Export a complete backup.
9. Refresh the browser without losing data.
10. Use the app comfortably on mobile.
11. Navigate using keyboard controls.
12. Recover from invalid import or storage problems without losing the entire dataset.

The central product test is not “does the dashboard look complete?”

It is:

> “Can the user maintain a real job search here without falling back to a spreadsheet?”

---

## 57. Immediate Build Priority

Execute in this order:

1. Foundation cleanup + architecture alignment
2. Application CRUD + detail/timeline
3. Board completion
4. Applications list
5. Overview
6. Follow-ups
7. Interviews
8. Saved jobs
9. Companies
10. Metrics
11. Settings + import/export
12. Cohesive design pass
13. Performance optimization
14. Final production audit
15. Release

Do not start with metrics or visual polish while core application data behavior is incomplete.
