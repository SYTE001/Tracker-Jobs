# Tracker-Jobs — Product Requirements Document V2
## Design, Workflow, UX and Production Completion Blueprint

**Product:** JobTrack / Tracker-Jobs  
**Repository:** `SYTE001/Tracker-Jobs`  
**Current branch:** `main`  
**Audit date:** 2026-09-25  
**Current latest commit reviewed:** `2199b4d639d591e2e756c06cf177a5a7e4bf1363`  
**Current stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Zod, React Hook Form, Radix UI, Lucide, Recharts, `@hello-pangea/dnd`, `sonner`, `puppeteer-core`

---

## 0. Purpose of This V2 PRD

This document supersedes the previous “feature-completion” mindset.

The repository already contains the core product surface: Overview, Applications, Board, Saved Jobs, Interviews, Follow-ups, Companies, Metrics, Settings, local persistence, import/export, onboarding and responsive shell.

The remaining work is not primarily “add more pages”. The next stage is to make the application:

- visually coherent,
- easier and faster to operate,
- less card-heavy,
- more complete in real-world workflows,
- consistent across routes,
- robust against edge cases,
- testable from a clean machine,
- and genuinely ready to deploy.

The target is a polished productivity application, not a feature checklist.

---

# 1. Current Repository Audit Snapshot

## 1.1 What is already implemented

Verified in the current `main` branch:

- React 19 + TypeScript + Vite application shell.
- Sidebar, topbar and mobile navigation.
- Overview dashboard.
- Applications table.
- Application detail drawer/route.
- Kanban board with drag-and-drop.
- Saved Jobs.
- Interviews.
- Follow-ups.
- Companies and company detail.
- Metrics.
- Settings.
- Data & Backup.
- Onboarding.
- Command palette.
- Zustand persistence with migrations.
- Zod domain schemas.
- Local JSON backup/import.
- CSV export.
- Ghosted application automation.
- Responsive mobile fallbacks.
- Dark/light/system theme state.
- Reduced-motion support.
- Sample data.

The latest repository commit explicitly describes the feature set as complete and includes cleanup of the legacy prototype and starter assets.

## 1.2 What is still materially incomplete

The current product is functionally broad but still has six important gaps:

1. **Visual hierarchy is repetitive.**
   Many sections use the same `rounded-lg + border + bg-card + p-*` treatment. This makes the interface read like a collection of boxes instead of one coherent productivity workspace.

2. **The dashboard is informative but not strongly action-oriented.**
   Overview distributes several equal-weight sections and card groups instead of establishing a clear “what needs my attention now?” hierarchy.

3. **Several workflows are technically present but operationally shallow.**
   Interviews and follow-ups are usable, but edit/delete/open/reschedule/result flows are incomplete or inconsistent. Some actions require too much context switching.

4. **Filters/search/navigation are not fully unified.**
   The PRD calls for URL-aware filtering, richer filters, saved views and global search. The current implementation only partially covers these.

5. **Production testing is underdeveloped.**
   `package.json` currently has `dev`, `build`, `lint`, and `preview`, but no formal `test`, `test:e2e`, or `test:smoke` script. `smoke.cjs` exists but is not exposed as an npm script and hardcodes a Windows Chrome path.

6. **Several data-quality and UX edge cases remain.**
   Examples include saved-job editing not repopulating the existing company name, metrics relying too heavily on current status, and corrupt local storage being silently replaced with a fresh state.

---

# 2. Product Direction

JobTrack should feel like a calm, dense, professional personal operating system for a job search.

It should communicate:

> “I know what I applied to, what is happening now, and what I need to do next.”

It should not feel like:

- a generic SaaS admin template,
- a CRM clone,
- a dashboard made from disconnected cards,
- an AI-generated design,
- or a decorative analytics product.

---

# 3. UX North Star

Every major page must answer one primary question.

| Page | Primary question |
|---|---|
| Overview | What needs my attention now? |
| Applications | What jobs do I have, and how do I manage them quickly? |
| Board | Where is every application in the pipeline? |
| Application Detail | What happened, what is next, and what do I know about this job? |
| Saved Jobs | What opportunities have I not acted on yet? |
| Interviews | What interviews do I have and what needs preparation? |
| Follow-ups | What action is due and what is overdue? |
| Companies | Which companies am I interacting with? |
| Metrics | What is working in my job search? |
| Settings | How does the product behave? |
| Data | Can I safely back up and recover everything? |

If a page does not answer its primary question quickly, redesign its hierarchy before adding more features.

---

# 4. Design System V2

## 4.1 Surface hierarchy

Stop treating every section as a card.

Use four surface levels:

### Level 0 — Page canvas

- Application background.
- No border.
- No shadow.
- Used for page-level layout.

### Level 1 — Section / grouping

- Optional top/bottom divider.
- Very subtle background tint only when needed.
- Prefer `border-b` or separators over rounded containers.
- Used for dashboard sections, filter regions and lists.

### Level 2 — Interactive item

- Small radius.
- Hover/focus treatment.
- Used for job rows, activity items, reminders and compact controls.

### Level 3 — Elevated surface

Use actual cards sparingly.

- KPI summary.
- Important alert.
- Modal/sheet.
- Contextual inspector.
- Compact content module that benefits from visual separation.

Rule:

> A page should not look like a grid of identical cards.

## 4.2 Radius

Use a small, consistent radius scale.

Preferred direction:

- Inputs/buttons: 8px.
- Compact interactive rows: 8px.
- Cards/surfaces: 10–12px.
- Avoid excessive pill-shaped containers.
- Pills are for status/tag semantics only.

## 4.3 Borders

Borders should establish hierarchy, not outline everything.

Use:

- 1px neutral border for real surfaces.
- Row separators inside tables/lists.
- Stronger border only for focus or selected states.

Avoid stacked borders around parent + child + grandchild elements.

## 4.4 Shadows

Default: none.

Use a shadow only for:

- open drawer,
- modal,
- command palette,
- dragged Kanban card,
- floating popover.

Do not use shadows as the primary source of visual hierarchy.

## 4.5 Colors

Maintain restrained neutral surfaces with one primary accent.

Semantic status colors are reserved for:

- status,
- warning,
- overdue,
- success,
- destructive actions.

Do not use large saturated background areas for status.

## 4.6 Typography

Create a clear hierarchy:

- Page title: 24–28px desktop, 20–24px mobile.
- Section title: 13–14px semibold.
- Body: 14px.
- Supporting metadata: 12–13px.
- Micro labels: 11–12px.

Do not use uppercase micro-labels everywhere. Reserve them for metadata/category labels.

Use tabular numerals for metrics.

## 4.7 Spacing

Use a consistent 4/8px rhythm.

Prefer:

- 8px
- 12px
- 16px
- 20px
- 24px
- 32px

Remove arbitrary spacing values unless the layout genuinely requires them.

## 4.8 Buttons

Create strong hierarchy:

Primary:
- One obvious primary action per page.

Secondary:
- Outline/neutral.

Tertiary:
- Ghost/icon.

Destructive:
- Red only when destructive.

Never put five visually equal buttons in one action row.

## 4.9 Form controls

Forms must be grouped into logical sections rather than long uninterrupted grids.

Use:

- required fields first,
- optional metadata after,
- advanced fields collapsible where useful,
- sticky footer actions on mobile,
- inline validation,
- disabled/loading state on submit.

## 4.10 Motion

Use motion to communicate state, not to decorate.

Target:

- 120–200ms micro-interactions.
- 200–260ms drawer/sheet transitions.
- No infinite decorative animation.
- Respect reduced motion.

---

# 5. Global Layout V2

## 5.1 Desktop

Keep:

- persistent sidebar,
- sticky topbar,
- centered content where appropriate,
- full-width board when needed.

Improve:

- make content width page-specific,
- avoid unnecessary 1400px whitespace,
- make topbar visually lighter,
- remove redundant decorative logo block on small desktop widths,
- maintain consistent left alignment across pages.

## 5.2 Sidebar

Current navigation works, but improve:

- stronger active indicator than only a full background fill,
- consistent icon alignment,
- clearer section separators,
- compact “due” badge for Follow-ups,
- optional collapsed tooltips,
- keyboard focus state,
- remember collapsed state across refresh.

## 5.3 Mobile

Replace the current simple “More” popup with a proper bottom sheet or bottom-aligned command surface.

Mobile navigation should prioritize:

- Overview
- Applications
- Add
- Board
- More

The Add action should be visually prominent without occupying excessive height.

## 5.4 Global mobile rule

Any desktop drawer becomes:

- full-screen detail,
- full-screen form,
- or bottom sheet.

Do not present a desktop-width modal centered on a mobile viewport.

---

# 6. Overview V2

## 6.1 Problem

The current Overview is functional but visually distributes too much attention equally across KPI cards, reminders, interviews, recent applications, source data and activity.

The user needs an action-first workspace.

## 6.2 New hierarchy

### Header

Left:

- Overview
- current date
- concise description

Right:

- Search
- Add Job

### Hero summary

Use a compact inline summary, not six identical cards.

Example:

`18 applications · 4 active · 2 interviews · 1 offer`

Then one primary action:

`+ Add application`

### Attention queue

Make this the dominant module.

Sections:

1. Overdue follow-ups.
2. Follow-ups due today.
3. Interviews in next 7 days.
4. Applications with no next action.

Each item should:

- identify job/company,
- show the action,
- show urgency,
- open the application,
- expose the next action directly.

### Pipeline strip

Use one horizontally structured pipeline summary:

`Wishlist → Applied → Interviewing → Offer → Rejected → Ghosted`

Each stage:

- count,
- subtle bar/indicator,
- clickable filter.

No six independent cards.

### Recent activity

Use a timeline/list.

### Analytics

Keep only the most useful analytics:

- application volume,
- source performance,
- response/interview conversion.

Do not show charts that do not change a decision.

---

# 7. Applications V2

## 7.1 Layout

Header:

- title,
- total count,
- Add job.

Toolbar:

- search,
- filters,
- saved views,
- density,
- column settings.

Keep the table as the primary desktop representation.

## 7.2 Required columns

Default:

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

Actions:

- Open
- Edit
- Change status
- Archive
- Delete

## 7.3 Filters

Add:

- status,
- source,
- priority,
- work mode,
- job type,
- company,
- date range,
- tags,
- follow-up due,
- upcoming interview,
- archived.

Provide:

- Clear all.
- Active filter chips.

## 7.4 URL state

Persist compatible filter state in URL query parameters.

Example:

`/applications?status=interviewing&source=linkedin`

Refreshing the page must preserve filters.

## 7.5 Saved views

P1.

Support user-created saved filter presets:

- Active applications
- Interviews
- Follow-up due
- Remote jobs
- High priority
- Archived

## 7.6 Bulk actions

Bulk toolbar must remain visible only when rows are selected.

Actions:

- status change,
- archive,
- delete,
- export,
- clear selection.

Add undo for safe reversible actions.

## 7.7 Mobile

Convert table rows into compact list cards.

Each item must show:

- logo,
- job title,
- company,
- status,
- next action,
- updated time,
- overflow actions.

Avoid showing every field.

---

# 8. Kanban Board V2

## 8.1 Board structure

Maintain six columns.

Improve:

- fixed column header,
- count,
- column action area,
- scroll container,
- consistent card height,
- visible drop zone,
- responsive empty column treatment.

## 8.2 Card redesign

Current cards are too visually card-like.

New card hierarchy:

Top:
- company logo,
- job title,
- company.

Middle:
- one important metadata line,
- tags only when useful.

Bottom:
- next follow-up,
- interview indicator,
- priority,
- overflow.

Do not display notes, salary, tags, location and every signal at once.

## 8.3 Card interactions

Desktop:

- open details by click,
- overflow menu for actions.

Mobile:

- no drag requirement,
- explicit status selector,
- tap card to open details.

## 8.4 Board toolbar

Add:

- search,
- status,
- source,
- priority,
- work mode,
- job type,
- date,
- sorting,
- density.

Sorting options:

- recently updated,
- applied date,
- priority,
- company,
- title,
- next action.

---

# 9. Application Detail V2

## 9.1 Current problem

The detail drawer contains correct data but reads as stacked sections.

## 9.2 New structure

### Sticky header

Contains:

- company logo,
- job title,
- company,
- status,
- priority,
- close.

### Primary action bar

Actions:

- change status,
- follow-up,
- interview,
- edit,
- open job link,
- archive,
- delete.

### Next action panel

This should be the first body section.

Display:

- next follow-up,
- interview date,
- overdue state,
- no-next-action warning,
- direct CTA.

### Job information

Use compact key/value layout.

### Activity timeline

Make timeline visually dominant.

### Interviews

Show:

- stage,
- type,
- date/time,
- interviewer,
- join link,
- result.

Allow edit/delete.

### Follow-ups

Show:

- due date,
- type,
- complete,
- reschedule,
- delete.

### Notes

Readable text area, not a large decorative block.

### Documents/links

Expose:

- job URL,
- resume used,
- cover letter,
- recruiter contact.

---

# 10. Quick Add V2

The current Add Application form is complete but too long for the fastest workflow.

Introduce two levels:

## Quick Add

Required:

- Job title
- Company
- Status

Optional inline:

- URL
- source
- priority

Primary CTA:

`Add application`

After saving:

- success feedback,
- `Open details`,
- `Add follow-up`.

## Full Edit

Detailed fields remain available in the full application form.

The user should be able to add a job in seconds without filling the whole form.

---

# 11. Follow-ups V2

## 11.1 Current problem

Follow-ups work, but the page is list-first instead of action-first.

## 11.2 New layout

Sections:

### Overdue

Each row must show:

- job,
- company,
- follow-up type,
- due date,
- direct open action,
- reschedule,
- complete.

### Today

Same structure.

### Upcoming

Group by:

- Tomorrow,
- This week,
- Later.

## 11.3 Interaction

Clicking a follow-up opens the related application detail.

Inline actions:

- complete,
- reschedule,
- open,
- delete.

Completed history should be collapsible.

## 11.4 Duplicate prevention

Warn before scheduling an identical reminder for the same application/date/type.

---

# 12. Interviews V2

## 12.1 Current problem

The list shows interviews but lacks complete lifecycle operations.

## 12.2 Interview workflow

Create:

- stage,
- type,
- date,
- start time,
- end time,
- interviewer,
- location,
- meeting URL,
- notes,
- result,
- follow-up date.

Edit:
Every interview shown in the page can be edited.

Delete:
Require confirmation.

Complete:
Set result and preserve the historical record.

## 12.3 Interview page

Tabs:

- Upcoming
- Past
- All

Add a compact “Next interview” block at the top.

Display:

- countdown,
- date/time,
- company,
- job,
- stage,
- meeting action.

---

# 13. Saved Jobs V2

## 13.1 Fix current edit workflow

The existing saved-job editor resets `companyName` to an empty value for an existing job.

Fix:

- repopulate company name on edit,
- validate it,
- preserve company relationship.

## 13.2 Saved job cards

Prefer compact list/table on desktop when there are many saved jobs.

Card view can remain available.

Show:

- job,
- company,
- source,
- salary,
- deadline,
- priority,
- notes preview.

Actions:

- Open URL
- Edit
- Convert to application
- Delete

## 13.3 Convert flow

After conversion:

- preserve saved job → application relationship,
- update saved status,
- create application,
- create creation event,
- route to application detail,
- explain what happened via toast.

Prevent accidental double conversion.

---

# 14. Companies V2

## 14.1 Companies page

Provide:

- search,
- sort,
- view switch,
- add company.

Desktop can default to table/list:

- company,
- applications,
- active,
- interviews,
- offers,
- latest activity.

Cards remain available for smaller datasets.

## 14.2 Company detail

Header:

- logo/initials,
- name,
- website,
- industry,
- location.

Summary:

- total applications,
- active,
- interviews,
- offers.

Applications:

- searchable,
- grouped by status optionally,
- click opens detail.

Notes:

- editable and readable.

## 14.3 Duplicate handling

When creating/editing a company:

- normalize case/spacing,
- detect duplicates,
- offer merge instead of silently creating another company.

---

# 15. Search V2

## 15.1 Global search

Command palette should search across:

- applications,
- companies,
- saved jobs,
- interviews,
- follow-ups.

Search fields:

- job title,
- company,
- notes,
- recruiter,
- source,
- location,
- tags.

## 15.2 Search UX

Show:

- grouped result sections,
- entity icon,
- title,
- secondary metadata,
- keyboard navigation,
- recent searches only when useful.

Do not render hundreds of results immediately.

## 15.3 Keyboard

Keep:

- Ctrl/Cmd + K
- N for new application
- Esc for overlays

Add:

- Enter = open highlighted result.

Avoid interfering with text inputs.

---

# 16. Metrics V2

## 16.1 Current problem

Current metrics are useful but some calculations are too dependent on current status.

Example:

An application that progressed from Applied → Interviewing → Rejected should still count as an interview.

## 16.2 Correct metric source

Derive historical funnel metrics from:

- application events,
- interview records,
- application lifecycle history.

Do not infer historical interviews exclusively from current status.

## 16.3 Required metrics

- total applications,
- applications per week/month,
- active,
- interviews,
- offers,
- rejections,
- ghosted,
- interview rate,
- offer rate,
- rejection rate,
- response rate,
- average time to first response,
- source performance,
- status distribution,
- work-mode distribution,
- salary distribution where sufficient data exists.

## 16.4 Filters

Add:

- time range,
- source,
- status,
- work mode,
- job type.

## 16.5 Chart rules

Every chart needs a clear purpose.

Preferred:

- application volume,
- stage conversion,
- source-to-interview comparison,
- response time distribution.

Avoid decorative donut charts unless they materially improve scanning.

---

# 17. Data Integrity V2

## 17.1 Local storage recovery

Current corrupt storage behavior silently falls back to a fresh state.

Improve:

1. Detect corrupt stored data.
2. Preserve the raw string in a recovery key when possible.
3. Show a clear recovery state.
4. Offer:
   - retry,
   - restore backup,
   - start fresh.
5. Never make data loss look like an empty account.

## 17.2 Import integrity

Validate:

- schema version,
- IDs,
- foreign keys,
- duplicate IDs,
- orphaned events,
- orphaned reminders,
- orphaned interviews,
- saved-job references.

Import should report:

- accepted,
- skipped,
- repaired,
- conflicted.

## 17.3 Export

Export should include:

- schema version,
- export timestamp,
- settings,
- companies,
- applications,
- events,
- reminders,
- interviews,
- saved jobs.

---

# 18. State Architecture V2

Keep Zustand.

Improve:

- domain actions remain centralized,
- selectors remain centralized,
- UI state remains local,
- derived metrics remain derived,
- repeated relationship lookups use maps/selectors.

Do not store:

- modal visibility,
- temporary form values,
- hover state,
- drag state,
- ephemeral loading.

## 18.1 Activity semantics

Define:

- `updated_at` = any persisted record update.
- `last_activity_at` = meaningful lifecycle activity.

Examples of meaningful activity:

- application created,
- status changed,
- interview added/completed,
- follow-up completed,
- recruiter reply/contact,
- meaningful note update.

Cosmetic updates must not reset ghosted timing.

---

# 19. Validation V2

Use Zod as the canonical runtime validation layer.

Current forms perform additional manual validation. Consolidate with:

- Zod schemas,
- React Hook Form resolver,
- domain-specific input schemas.

Validation must cover:

- required fields,
- URLs,
- dates,
- time ranges,
- salary min/max,
- enum values,
- string lengths,
- tag normalization.

Show field errors inline.

---

# 20. Application Timeline Rules

Events must preserve history without creating excessive noise.

Required events:

- created,
- status changed,
- interview scheduled,
- interview completed,
- follow-up scheduled,
- follow-up completed,
- recruiter contacted,
- recruiter replied,
- offer received,
- rejection received,
- archived,
- restored.

Optional event:

- meaningful notes update.

Do not create an event for every cosmetic field change.

---

# 21. Status Workflow Improvements

Canonical statuses:

1. Wishlist
2. Applied
3. Interviewing
4. Offer
5. Rejected
6. Ghosted

Rules:

- Adding an interview should offer to move the application to Interviewing.
- Recording an offer should offer to move to Offer.
- Recording rejection should offer to move to Rejected.
- Ghosted is automated only when enabled.
- User can manually override status.
- Every status change creates a history event.
- Previous status remains visible in timeline.

Never destroy lifecycle history.

---

# 22. “Next Action” System

Introduce a derived concept:

`next_action`

Possible values:

- Apply
- Follow up
- Prepare interview
- Attend interview
- Respond to recruiter
- Check application
- Review offer
- None

For each active application, the UI should try to answer:

> “What should I do next?”

Display next action consistently in:

- Overview,
- Applications,
- Board card,
- Application Detail.

This is one of the most important product improvements.

---

# 23. Actionable Dashboard Logic

Applications without a next action should be detectable.

Create derived warnings:

- overdue follow-up,
- interview within 48h,
- application inactive for N days,
- deadline within 3 days,
- no next action.

Priority order:

1. Overdue.
2. Interview soon.
3. Deadline soon.
4. Follow-up today.
5. Needs next action.
6. Recently changed.

This produces an operational dashboard rather than a passive statistics dashboard.

---

# 24. Notifications and Undo

Success feedback:

- Application added.
- Status changed.
- Follow-up scheduled.
- Interview added.
- Backup exported.

Warnings:

- Follow-up overdue.
- Deadline approaching.
- Duplicate record detected.

Undo where safe:

- archive,
- restore,
- complete reminder,
- certain bulk actions.

Delete remains confirmation-based.

Avoid toast spam.

---

# 25. Accessibility V2

Required:

- visible focus,
- keyboard navigation,
- semantic controls,
- correct labels,
- screen-reader names,
- dialog focus,
- Escape close,
- status not represented only by color,
- reduced motion,
- touch target >= 44px where appropriate,
- no nested interactive elements.

Fix especially:

- interactive elements nested inside links,
- clickable table rows containing interactive controls,
- icon-only buttons without labels.

---

# 26. Responsive Requirements

## Desktop

- dense,
- fast,
- persistent navigation,
- full Kanban width.

## Tablet

- collapsible sidebar,
- dense table,
- horizontal board.

## Mobile

- bottom navigation,
- full-screen detail,
- full-screen/bottom-sheet forms,
- compact cards,
- status selectors instead of drag-and-drop,
- horizontally scrollable filters,
- sticky mobile action bars.

No accidental body-level horizontal scrolling.

---

# 27. Design Pass — Page-by-Page Acceptance

Every page must receive a visual redesign pass.

## Overview

Must feel like an operations dashboard.

Primary focus:
attention queue.

## Applications

Must feel like a serious data-management workspace.

Primary focus:
fast scanning + filtering.

## Board

Must feel like a pipeline tool.

Primary focus:
status movement.

## Saved Jobs

Must feel like an opportunity inbox.

Primary focus:
review → convert.

## Interviews

Must feel like a schedule.

Primary focus:
what is next.

## Follow-ups

Must feel like a task queue.

Primary focus:
what is overdue/today.

## Companies

Must feel like a lightweight relationship directory.

Primary focus:
company context.

## Metrics

Must feel like analysis.

Primary focus:
actionable comparisons.

## Settings

Must feel simple and low-frequency.

Primary focus:
configuration, not decoration.

---

# 28. Visual Cleanup Checklist

Remove or reduce:

- repeated rounded card wrappers,
- excessive container backgrounds,
- excessive shadows,
- giant headings,
- large empty vertical gaps,
- unnecessary uppercase labels,
- too many status pills,
- duplicated CTAs,
- decorative chart containers,
- generic dashboard layouts.

Preserve:

- strong alignment,
- subtle borders,
- restrained accent,
- clear status semantics,
- compact metadata,
- meaningful whitespace.

---

# 29. Component Refactor

Before redesigning each page independently, establish reusable primitives for:

- PageHeader,
- Section,
- MetricSummary,
- ActionQueue,
- DataTable,
- ListRow,
- StatusChip,
- PriorityChip,
- EmptyState,
- ErrorState,
- Skeleton,
- DetailHeader,
- DetailSection,
- Timeline,
- FilterBar,
- FilterChip,
- MobileActionBar,
- ConfirmDialog,
- CommandSearch.

Do not create one-off versions of the same UI pattern in every feature.

---

# 30. Table and List Standards

Tables:

- row height 48–56px,
- strong header hierarchy,
- sticky header where useful,
- row hover,
- selected state,
- keyboard/focus state.

Lists:

- consistent left alignment,
- company identity,
- primary text,
- secondary metadata,
- action affordance.

Never make every row look like a separate floating card.

---

# 31. Form Standards

All forms must:

- preserve existing values during edit,
- validate before submit,
- show errors beside fields,
- use consistent label/value spacing,
- support keyboard submission,
- prevent double submission,
- retain accessibility labels.

Mobile:

- full-screen or bottom sheet,
- sticky action footer,
- no inaccessible controls hidden below the fold.

---

# 32. Testing Infrastructure V2

## 32.1 Required npm scripts

Add:

```json
{
  "test": "...",
  "test:smoke": "...",
  "test:e2e": "...",
  "test:build": "..."
}
```

Exact tooling should respect the current stack.

## 32.2 Smoke script

Current `smoke.cjs` exists but is not a package script and uses a hardcoded Chrome path.

Replace that assumption with a configurable executable:

- environment variable first,
- known browser fallback second,
- clear error third.

Example concept:

`PUPPETEER_EXECUTABLE_PATH`

The smoke test must run on a clean machine with documented setup.

## 32.3 Required smoke flow

1. Open app.
2. Redirect to Overview.
3. Complete onboarding.
4. Seed sample data.
5. Verify Overview.
6. Navigate Board.
7. Verify all six statuses.
8. Open Add Job.
9. Create application.
10. Open Applications.
11. Search application.
12. Open detail.
13. Change status.
14. Add follow-up.
15. Complete follow-up.
16. Add interview.
17. Open Interviews.
18. Open Company.
19. Open Metrics.
20. Export backup.
21. Refresh.
22. Verify persistence.
23. Toggle theme.
24. Verify theme persistence.
25. Verify no console/page errors.

---

# 33. Production Build Checks

Before release:

```bash
npm install
npm run lint
npm run build
npm run test:smoke
```

Then run:

```bash
npm run preview
```

and execute the browser smoke test against the production preview.

---

# 34. Deployment Readiness

Because the application uses `BrowserRouter` with Vite/static hosting, deployment must support SPA history fallback.

Verify:

- `/overview`
- `/applications`
- `/applications/:id`
- `/board`
- `/saved`
- `/interviews`
- `/followups`
- `/companies`
- `/companies/:id`
- `/metrics`
- `/settings`
- `/settings/data`

Directly opening nested URLs must not return a hosting-level 404.

Add deployment rewrite configuration when required by the host.

---

# 35. Metadata and Branding

Production baseline:

- correct document title,
- meta description,
- favicon,
- theme color,
- Open Graph where useful,
- no Vite starter title,
- no starter copy,
- correct app name.

Target title:

`JobTrack — Job Application Tracker`

---

# 36. Performance V2

Targets:

- no obvious lag with hundreds of applications,
- search remains responsive,
- Kanban drag remains smooth,
- charts do not block initial render,
- secondary routes are lazy loaded,
- relationship lookups are memoized,
- no unnecessary global re-renders.

Optimize only after visual and functional completion.

Priorities:

1. store selectors,
2. list rendering,
3. search,
4. chart loading,
5. image/logo behavior,
6. route splitting.

---

# 37. Security and Privacy

Maintain local-first architecture.

Required:

- no secrets in source,
- no server keys in browser,
- safe external links,
- no sensitive console logging,
- no unnecessary third-party data requests,
- explicit local-storage privacy messaging.

External link:

`target="_blank"` must be paired with:

`rel="noopener noreferrer"`

---

# 38. PWA / Offline

Optional.

Do not block release on PWA.

If added later:

- offline indicator,
- installable manifest,
- app shell cache,
- local data remains available.

---

# 39. Development Workflow for the Coding Agent

The coding agent must read this entire PRD before modifying the project.

## Phase A — Inspect

1. Read PRD.
2. Inspect current branch.
3. Inspect architecture.
4. Inspect existing routes.
5. Inspect design primitives.
6. Identify current implementation vs requirements.

## Phase B — Fix critical workflow gaps

Fix:

- saved-job edit company bug,
- metrics historical interview logic,
- data recovery behavior,
- interview edit/delete,
- follow-up open/reschedule behavior,
- filter completeness,
- URL filter state,
- testing scripts.

## Phase C — Build next-action model

Implement:

- next action derivation,
- attention queue,
- deadline warnings,
- inactive application signal.

## Phase D — Unified design system

Refactor surfaces and shared components first.

Do not redesign page-by-page without shared tokens/components.

## Phase E — Redesign pages

Order:

1. Overview
2. Applications
3. Application Detail
4. Board
5. Follow-ups
6. Interviews
7. Saved Jobs
8. Companies
9. Metrics
10. Settings/Data

## Phase F — Responsive pass

Test:

- 375px,
- 390px,
- 768px,
- 1024px,
- 1280px+.

## Phase G — QA

Run:

- lint,
- build,
- smoke,
- manual interaction checks,
- mobile checks,
- dark mode checks.

## Phase H — Final audit

Only after all implementation is complete.

---

# 40. Agent Rules

1. Inspect before editing.
2. Preserve working architecture.
3. Do not rewrite entire pages without identifying the actual problem.
4. Prefer shared components over duplicated code.
5. Keep local-first architecture.
6. Do not introduce dependencies for trivial helpers.
7. Do not create fake data to hide incomplete workflows.
8. Do not mark a feature complete because the UI exists.
9. Verify every connected workflow.
10. Fix errors instead of reporting them.
11. Minimize unnecessary file reads and tool calls.
12. Keep changes coherent and reversible.
13. Do not start a full audit after every tiny change.
14. Use this PRD as source of truth for the current enhancement phase.
15. Record deviations from this PRD.

---

# 41. Definition of Done — UX

A route is done only when:

- hierarchy is clear,
- primary action is obvious,
- secondary actions are subordinate,
- there are no redundant cards,
- empty state is intentional,
- loading/error state exists,
- mobile layout is usable,
- dark mode is coherent,
- keyboard interactions work,
- status is never conveyed by color alone,
- destructive actions are deliberate.

---

# 42. Definition of Done — Workflow

A workflow is done only when the user can complete it end-to-end.

Examples:

### Add application

Add → save → see in Overview → see in List → see on Board → open detail.

### Status change

Change → event created → board updates → metrics update → detail timeline updates.

### Follow-up

Schedule → appears in Overview → appears in Follow-ups → complete/reschedule → event recorded.

### Interview

Create → appears in Overview → appears in Interviews → appears in detail → edit/delete/result supported.

### Saved job

Save → edit → convert → application created → relationship preserved.

### Company

Create → reuse → stats update → applications linked → detail accessible.

### Backup

Export → clear/refresh environment → import → validate → restore.

---

# 43. Definition of Done — Production

Required:

- `npm run lint` passes.
- `npm run build` passes.
- `npm run test:smoke` passes.
- No critical console errors.
- All routes load directly.
- CRUD works.
- Board/list/detail stay synchronized.
- Timeline preserves history.
- Follow-ups work.
- Interviews work.
- Saved jobs work.
- Companies work.
- Metrics derive from historical data.
- Import/export works.
- Corrupt data has a recovery path.
- Mobile is usable.
- Dark mode works.
- Accessibility baseline passes.
- No Vite starter remnants.
- No fake buttons.
- No dead navigation.
- No excessive card-based visual repetition.
- README accurately reflects the current product.

---

# 44. Final Release Test

A new user should be able to:

1. Open JobTrack.
2. Start empty or load sample data.
3. Add multiple applications quickly.
4. See every application in List and Board.
5. Open one application and understand its current state in seconds.
6. Know what the next action is.
7. Schedule a follow-up.
8. Add an interview.
9. See overdue/upcoming actions from Overview.
10. Search and filter the dataset.
11. Review metrics.
12. Export a backup.
13. Reload the app without losing data.
14. Use the core workflow on mobile.
15. Navigate with keyboard.
16. Recover from an invalid import without losing the existing dataset.

---

# 45. Priority Matrix

## P0 — Must complete before live

- Unified design system / surface hierarchy.
- Overview redesign.
- Applications redesign.
- Application Detail redesign.
- Next Action system.
- Follow-up workflow completion.
- Interview workflow completion.
- Search/filter improvements.
- Historical metrics correction.
- Saved Jobs edit bug fix.
- Data recovery improvements.
- Test scripts.
- Cross-platform smoke test.
- SPA routing verification.
- Mobile UX pass.
- Dark mode pass.
- Accessibility pass.

## P1 — Strongly recommended

- Saved Views.
- Company duplicate merge.
- Timeline refinements.
- Advanced bulk actions.
- Calendar-style interview/follow-up presentation.
- Richer analytics.

## P2 — Defer

- Authentication.
- Cloud sync.
- Email/calendar integrations.
- Browser extension.
- AI job parsing.
- External notification channels.

---

# 46. Implementation Order

Execute exactly in this order:

### 1. Critical correctness fixes
- saved job edit bug,
- metric history logic,
- data recovery,
- interview CRUD,
- follow-up navigation/actions.

### 2. Next Action engine
- derived next action,
- attention states,
- deadline/overdue logic.

### 3. Search/filter architecture
- unified filtering,
- URL state,
- global search,
- clear-all/filter chips.

### 4. Shared design system refactor
- surfaces,
- spacing,
- typography,
- buttons,
- inputs,
- sections,
- list/table primitives,
- detail sections.

### 5. Overview redesign

### 6. Applications redesign

### 7. Application Detail redesign

### 8. Board redesign

### 9. Follow-ups redesign

### 10. Interviews redesign

### 11. Saved Jobs redesign

### 12. Companies redesign

### 13. Metrics redesign

### 14. Settings/Data polish

### 15. Mobile + dark-mode pass

### 16. Testing infrastructure

### 17. Production verification

### 18. Final audit

### 19. Release candidate

---

# 47. Anti-Slop Rules V2

Never add:

- purple AI gradients,
- random glassmorphism,
- giant hero blocks inside the app,
- excessive pill controls,
- giant illustrations,
- fake analytics,
- fake testimonials,
- fake activity,
- fake user counts,
- meaningless badges,
- decorative chart spam,
- “AI-powered” labels with no product behavior,
- repeated identical cards for every section.

Every visual element must earn its place.

---

# 48. Final Product Principle

The product should optimize for:

**clarity → speed → action → history → insight**

Not:

**more features → more cards → more decoration**

The best improvement is not adding another dashboard widget.

It is making it obvious what the user should do next.

---

# 49. Source of Truth

This V2 PRD is the source of truth for the enhancement phase.

The existing repository remains the implementation baseline.

The agent must:

- inspect first,
- preserve valid existing behavior,
- implement missing workflows,
- redesign the visual system coherently,
- verify changes,
- and only then perform the final production audit.

