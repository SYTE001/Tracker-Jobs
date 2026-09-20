/* JobTrack — client-side personal job-search tracker.
   All records are stored locally in the browser under one relational data object.
   The schema mirrors: applications, companies, application_events, saved_jobs and reminders. */
(() => {
  'use strict';

  const STORAGE_KEY = 'jobtrack-local-db-v1';
  const STATUS_OPTIONS = ['Saved', 'Applied', 'Screening', 'Interview', 'Technical Test', 'Final Interview', 'Offer', 'Hired', 'Rejected', 'Withdrawn'];
  const PIPELINE_STATUSES = ['Applied', 'Screening', 'Interview', 'Technical Test', 'Final Interview', 'Offer', 'Hired'];
  const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Contract'];
  const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];
  const SOURCES = ['LinkedIn', 'Glints', 'Pintarnya', 'JobStreet', 'Kalibrr', 'Instagram', 'Threads', 'WhatsApp', 'Company Website', 'Referral', 'Other'];
  const PRIORITIES = ['Low', 'Medium', 'High'];
  const TERMINAL = new Set(['Rejected', 'Withdrawn', 'Hired']);
  const SOURCE_COLORS = {
    LinkedIn: '#3776d2', Glints: '#f15b37', Pintarnya: '#2f9d6b', JobStreet: '#1458b8', Kalibrr: '#e4585d',
    Instagram: '#b8507d', Threads: '#222222', WhatsApp: '#31a86a', 'Company Website': '#777770', Referral: '#906fc4', Other: '#8d8d86'
  };

  const appRoot = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');

  const state = {
    db: null,
    view: 'dashboard',
    detailAppId: null,
    appViewMode: 'table',
    filters: defaultFilters(),
    globalQuery: '',
    globalOpen: false,
    notificationOpen: false,
    profileOpen: false,
    quickFilterOpen: false,
    sidebarOpen: false,
    calendarDate: startOfMonth(new Date()),
    loading: true
  };

  function defaultFilters() {
    return { search: '', status: '', source: '', jobType: '', workMode: '', priority: '', company: '', minSalary: '', maxSalary: '', after: '', before: '', sort: 'newest' };
  }

  // ---------- Helpers ----------
  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }
  function localDate(date = new Date()) {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
  }
  function dateOffset(days) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return localDate(d);
  }
  function toDate(value) {
    if (!value) return null;
    const d = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function startOfDay(value = new Date()) {
    const d = value instanceof Date ? new Date(value) : toDate(value);
    if (!d) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function startOfMonth(value) {
    const d = value instanceof Date ? new Date(value) : toDate(value);
    d.setDate(1); d.setHours(0, 0, 0, 0);
    return d;
  }
  function addDays(value, amount) {
    const d = value instanceof Date ? new Date(value) : toDate(value);
    d.setDate(d.getDate() + amount);
    return d;
  }
  function addMonths(value, amount) {
    const d = new Date(value);
    d.setMonth(d.getMonth() + amount);
    return d;
  }
  function diffDays(a, b) {
    const da = startOfDay(a), db = startOfDay(b);
    if (!da || !db) return null;
    return Math.round((da - db) / 86400000);
  }
  function isSameDay(a, b) {
    return !!a && !!b && localDate(a) === localDate(b);
  }
  function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
    const d = toDate(value);
    return d ? new Intl.DateTimeFormat('en-GB', options).format(d) : '—';
  }
  function formatShortDate(value) {
    return formatDate(value, { day: 'numeric', month: 'short' });
  }
  function formatMonth(value) {
    return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(value);
  }
  function formatNumber(value) { return new Intl.NumberFormat('id-ID').format(Number(value || 0)); }
  function formatMoney(value) {
    const number = Number(value || 0);
    if (!number) return '—';
    if (number >= 1000000 && number % 1000000 === 0) return `Rp${number / 1000000} jt`;
    return `Rp${new Intl.NumberFormat('id-ID').format(number)}`;
  }
  function salaryLabel(item) {
    const min = Number(item.salary_min || item.salary || 0);
    const max = Number(item.salary_max || 0);
    if (min && max) return `${formatMoney(min)} – ${formatMoney(max)}`;
    if (min) return `${formatMoney(min)}+`;
    if (max) return `Up to ${formatMoney(max)}`;
    return '—';
  }
  function humanDue(value) {
    const n = diffDays(value, new Date());
    if (n === null) return '';
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n === -1) return 'Yesterday';
    if (n < 0) return `${Math.abs(n)}d overdue`;
    return `In ${n}d`;
  }
  function e(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }
  function attr(value) { return e(value); }
  function statusClass(status) { return `status-${String(status || '').replace(/\s+/g, '-')}`; }
  function sourceColor(source) { return SOURCE_COLORS[source] || SOURCE_COLORS.Other; }
  function initials(value) {
    return String(value || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(v => v[0]).join('').toUpperCase() || '?';
  }
  function selected(value, expected) { return String(value ?? '') === String(expected) ? 'selected' : ''; }
  function checked(value) { return value ? 'checked' : ''; }
  function nowIso() { return new Date().toISOString(); }

  // Lightweight inline icon set so the interface has no external dependency.
  function icon(name, className = '') {
    const paths = {
      dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      applications: '<path d="M8 3h8l4 4v14H4V3h4z"/><path d="M16 3v5h5M8 13h8M8 17h6"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
      company: '<path d="M3 21h18M5 21V5l7-3v19M19 21V10l-7-3M8 7h1M8 11h1M8 15h1M15 12h1M15 16h1"/>',
      analytics: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/><path d="M4 10h0M10 4h0M16 13h0"/>',
      bookmark: '<path d="M6 3h12v18l-6-4-6 4V3z"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.05.05-2.2 2.2-.05-.05a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47V20h-3.12v-.08a1.6 1.6 0 0 0-.97-1.47 1.6 1.6 0 0 0-1.77.32l-.05.05-2.2-2.2.05-.05A1.6 1.6 0 0 0 7.05 15a1.6 1.6 0 0 0-1.47-.97H5.5v-3.12h.08A1.6 1.6 0 0 0 7.05 9.94a1.6 1.6 0 0 0-.32-1.77l-.05-.05 2.2-2.2.05.05a1.6 1.6 0 0 0 1.77.32 1.6 1.6 0 0 0 .97-1.47V4.75h3.12v.07a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.05-.05 2.2 2.2-.05.05a1.6 1.6 0 0 0-.32 1.77 1.6 1.6 0 0 0 1.47.97h.07v3.12h-.07A1.6 1.6 0 0 0 19.4 15z"/>',
      search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
      filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
      chevronDown: '<path d="m7 10 5 5 5-5"/>',
      chevronLeft: '<path d="m14 7-5 5 5 5"/>',
      chevronRight: '<path d="m10 7 5 5-5 5"/>',
      more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
      table: '<path d="M3 5h18v14H3zM3 10h18M9 5v14"/>',
      columns: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>',
      arrowUpRight: '<path d="M7 17 17 7M9 7h8v8"/>',
      clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
      target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m17.7 6.3 2-2"/>',
      trend: '<path d="m4 16 5-5 4 3 7-8"/><path d="M15 6h5v5"/>',
      briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      edit: '<path d="M4 20h4l11-11a2.1 2.1 0 0 0-3-3L5 17v3zM14.5 7.5l3 3"/>',
      trash: '<path d="M4 7h16M10 11v5M14 11v5M9 7l1-3h4l1 3M6 7l1 14h10l1-14"/>',
      download: '<path d="M12 3v11M8 10l4 4 4-4M4 20h16"/>',
      upload: '<path d="M12 15V4M8 8l4-4 4 4M4 20h16"/>',
      moon: '<path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5z"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      alert: '<path d="M12 3 2.8 20h18.4L12 3zM12 9v4M12 17h.01"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
      file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4"/>',
      link: '<path d="M10 13.5a4.5 4.5 0 0 0 6.4.1l2-2a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1M14 10.5a4.5 4.5 0 0 0-6.4-.1l-2 2A4.5 4.5 0 0 0 12 18.8l1.1-1.1"/>',
      paperclip: '<path d="m8.5 12.5 6-6a3 3 0 1 1 4.2 4.2l-7.5 7.5a5 5 0 1 1-7.1-7.1l7-7"/>',
      location: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
      refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.7L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.7L20 16M20 20v-4h-4"/>',
      external: '<path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
      list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>'
    };
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
  }

  // ---------- Local relational seed/database ----------
  function createSeedDatabase() {
    const c1 = 'company_nusa', c2 = 'company_atlas', c3 = 'company_karya', c4 = 'company_hara', c5 = 'company_finstack';
    const a1 = 'app_frontend_nusa', a2 = 'app_uiux_atlas', a3 = 'app_web_karya', a4 = 'app_graphic_hara', a5 = 'app_intern_finstack';
    const created = nowIso();
    return {
      version: 1,
      meta: { demoStartedAt: created, theme: 'light' },
      companies: [
        { id: c1, name: 'Nusa Digital', logo: '', website: 'https://example.com', industry: 'Technology', location: 'Jakarta', notes: '', is_seed: true },
        { id: c2, name: 'Studio Atlas', logo: '', website: '', industry: 'Design & Creative', location: 'Jakarta', notes: '', is_seed: true },
        { id: c3, name: 'Karya Kreatif', logo: '', website: '', industry: 'Creative Agency', location: 'Bandung', notes: '', is_seed: true },
        { id: c4, name: 'Hara Studio', logo: '', website: '', industry: 'Consumer Brand', location: 'Jakarta', notes: '', is_seed: true },
        { id: c5, name: 'Finstack', logo: '', website: '', industry: 'Fintech', location: 'Remote', notes: '', is_seed: true }
      ],
      applications: [
        { id: a1, company_id: c1, job_title: 'Frontend Developer', job_type: 'Full-time', location: 'Jakarta', work_mode: 'Hybrid', source: 'LinkedIn', job_url: 'https://linkedin.com', applied_date: dateOffset(-2), salary_min: 10000000, salary_max: 14000000, recruiter_name: 'Dewi Anindita', recruiter_contact: 'dewi@nusa.example', status: 'Applied', priority: 'High', deadline: '', next_followup: dateOffset(3), notes: 'Submitted portfolio and latest CV. Follow up if there is no response.', job_description: 'Build thoughtful, fast web interfaces for product teams.', requirements: 'React, TypeScript, strong product sensibility.', interview_details: '', resume_used: 'CV — Frontend.pdf', cover_letter_used: '', attachments: [], created_at: created, updated_at: new Date(Date.now() - 2 * 86400000).toISOString(), is_seed: true },
        { id: a2, company_id: c2, job_title: 'UI/UX Designer', job_type: 'Full-time', location: 'Jakarta', work_mode: 'Hybrid', source: 'Glints', job_url: 'https://glints.com', applied_date: dateOffset(-5), salary_min: 9000000, salary_max: 13000000, recruiter_name: 'Maya Putri', recruiter_contact: 'maya@atlas.example', status: 'Interview', priority: 'High', deadline: dateOffset(5), next_followup: '', notes: 'Prepare case-study walkthrough and questions about the design system.', job_description: 'Own user journeys for a growing consumer product.', requirements: 'Portfolio, Figma, usability research, collaboration.', interview_details: `Portfolio interview — Google Meet, ${formatShortDate(dateOffset(1))}, 10:00 WIB`, resume_used: 'CV — Product Design.pdf', cover_letter_used: 'Atlas cover letter.pdf', attachments: [], created_at: created, updated_at: new Date(Date.now() - 86400000).toISOString(), is_seed: true },
        { id: a3, company_id: c3, job_title: 'Web Designer', job_type: 'Contract', location: 'Bandung', work_mode: 'On-site', source: 'JobStreet', job_url: 'https://jobstreet.com', applied_date: dateOffset(-13), salary_min: 7000000, salary_max: 9000000, recruiter_name: '', recruiter_contact: '', status: 'Rejected', priority: 'Medium', deadline: '', next_followup: '', notes: 'Closed after portfolio review.', job_description: '', requirements: '', interview_details: '', resume_used: '', cover_letter_used: '', attachments: [], created_at: created, updated_at: new Date(Date.now() - 10 * 86400000).toISOString(), is_seed: true },
        { id: a4, company_id: c4, job_title: 'Graphic Designer', job_type: 'Full-time', location: 'Jakarta', work_mode: 'On-site', source: 'Instagram', job_url: '', applied_date: dateOffset(-4), salary_min: 6500000, salary_max: 8500000, recruiter_name: 'Raka', recruiter_contact: '@harastudio', status: 'Screening', priority: 'Medium', deadline: '', next_followup: dateOffset(2), notes: 'Sent a compact visual portfolio through email.', job_description: 'Create campaign and social visuals for a lifestyle brand.', requirements: 'Adobe CC, visual storytelling, editorial taste.', interview_details: '', resume_used: 'CV — Creative.pdf', cover_letter_used: '', attachments: [], created_at: created, updated_at: new Date(Date.now() - 86400000).toISOString(), is_seed: true },
        { id: a5, company_id: c5, job_title: 'Frontend Intern', job_type: 'Internship', location: '', work_mode: 'Remote', source: 'Threads', job_url: '', applied_date: '', salary_min: 0, salary_max: 0, recruiter_name: '', recruiter_contact: '', status: 'Saved', priority: 'Low', deadline: dateOffset(9), next_followup: '', notes: 'Interesting early-stage role. Review requirements before applying.', job_description: '', requirements: '', interview_details: '', resume_used: '', cover_letter_used: '', attachments: [], created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString(), is_seed: true }
      ],
      application_events: [
        { id: 'event_a1_apply', application_id: a1, event_type: 'Applied', event_date: dateOffset(-2), title: 'Application submitted', description: 'Applied through LinkedIn.', is_seed: true },
        { id: 'event_a2_apply', application_id: a2, event_type: 'Applied', event_date: dateOffset(-5), title: 'Application submitted', description: 'Applied through Glints.', is_seed: true },
        { id: 'event_a2_view', application_id: a2, event_type: 'Recruiter Viewed', event_date: dateOffset(-4), title: 'Recruiter viewed application', description: '', is_seed: true },
        { id: 'event_a2_screen', application_id: a2, event_type: 'Screening', event_date: dateOffset(-3), title: 'Screening complete', description: 'Moved forward to a portfolio interview.', is_seed: true },
        { id: 'event_a2_interview', application_id: a2, event_type: 'Interview', event_date: dateOffset(1), title: 'Portfolio interview', description: 'Google Meet · 10:00 WIB', is_seed: true },
        { id: 'event_a3_apply', application_id: a3, event_type: 'Applied', event_date: dateOffset(-13), title: 'Application submitted', description: 'Applied through JobStreet.', is_seed: true },
        { id: 'event_a3_rejected', application_id: a3, event_type: 'Rejected', event_date: dateOffset(-10), title: 'Application closed', description: 'Portfolio review was not selected.', is_seed: true },
        { id: 'event_a4_apply', application_id: a4, event_type: 'Applied', event_date: dateOffset(-4), title: 'Application submitted', description: 'Sent through Instagram contact.', is_seed: true },
        { id: 'event_a4_screen', application_id: a4, event_type: 'Screening', event_date: dateOffset(-1), title: 'Screening in progress', description: '', is_seed: true },
        { id: 'event_a5_save', application_id: a5, event_type: 'Saved', event_date: dateOffset(-1), title: 'Job saved', description: 'Saved from Threads.', is_seed: true }
      ],
      saved_jobs: [],
      reminders: [
        { id: 'reminder_a2_interview', application_id: a2, reminder_type: 'Interview', reminder_date: dateOffset(1), completed: false, is_seed: true }
      ]
    };
  }

  function normalizeDb(db) {
    const safe = db && typeof db === 'object' ? db : createSeedDatabase();
    safe.version = 1;
    safe.meta = safe.meta || { theme: 'light' };
    safe.meta.theme = safe.meta.theme || 'light';
    ['companies', 'applications', 'application_events', 'saved_jobs', 'reminders'].forEach(k => { if (!Array.isArray(safe[k])) safe[k] = []; });
    safe.applications.forEach(app => {
      app.attachments = Array.isArray(app.attachments) ? app.attachments : [];
      app.status = app.status || 'Saved'; app.priority = app.priority || 'Medium';
      app.created_at = app.created_at || nowIso(); app.updated_at = app.updated_at || app.created_at;
    });
    return safe;
  }
  function loadDb() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return normalizeDb(value ? JSON.parse(value) : createSeedDatabase());
    } catch (err) {
      console.warn('JobTrack storage was reset after an unreadable record.', err);
      return createSeedDatabase();
    }
  }
  function saveDb() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.db));
    document.documentElement.dataset.theme = state.db.meta.theme || 'light';
  }
  function hasSeedData() {
    return state.db.applications.some(x => x.is_seed) || state.db.saved_jobs.some(x => x.is_seed);
  }
  function getCompany(id) { return state.db.companies.find(c => c.id === id); }
  function getApplication(id) { return state.db.applications.find(a => a.id === id); }
  function appCompanyName(app) { return getCompany(app.company_id)?.name || 'Unknown company'; }
  function sortedEvents(appId) {
    return state.db.application_events.filter(ev => ev.application_id === appId).sort((a, b) => String(b.event_date).localeCompare(String(a.event_date)) || String(b.id).localeCompare(String(a.id)));
  }
  function getLatestInteraction(app) {
    const events = sortedEvents(app.id);
    const e0 = events[0];
    return e0?.event_date || app.updated_at?.slice(0, 10) || app.applied_date || app.created_at?.slice(0, 10);
  }

  // ---------- Calculated data; every figure is derived from persisted records ----------
  function appIsResponded(app) {
    if (['Screening', 'Interview', 'Technical Test', 'Final Interview', 'Offer', 'Hired', 'Rejected'].includes(app.status)) return true;
    return state.db.application_events.some(ev => ev.application_id === app.id && !['Applied', 'Saved'].includes(ev.event_type));
  }
  function activeApplications() { return state.db.applications.filter(a => !TERMINAL.has(a.status) && a.status !== 'Saved'); }
  function applicationsThisWeek() {
    const now = startOfDay();
    const day = (now.getDay() + 6) % 7; // Monday zero
    const monday = addDays(now, -day);
    return state.db.applications.filter(a => a.applied_date && toDate(a.applied_date) >= monday && toDate(a.applied_date) <= addDays(monday, 6));
  }
  function responseRate() {
    const sent = state.db.applications.filter(a => a.status !== 'Saved');
    return sent.length ? Math.round((sent.filter(appIsResponded).length / sent.length) * 100) : 0;
  }
  function dashboardMetrics() {
    return [
      { label: 'Total applications', value: state.db.applications.length, foot: `${activeApplications().length} active opportunity`, icon: 'briefcase' },
      { label: 'Applied this week', value: applicationsThisWeek().length, foot: 'Based on applied date', icon: 'calendar' },
      { label: 'Interview', value: state.db.applications.filter(a => ['Interview', 'Technical Test', 'Final Interview'].includes(a.status)).length, foot: 'Across active stages', icon: 'clock' },
      { label: 'Offer', value: state.db.applications.filter(a => a.status === 'Offer').length, foot: 'Awaiting a decision', icon: 'target' },
      { label: 'Rejected', value: state.db.applications.filter(a => a.status === 'Rejected').length, foot: 'Keep moving forward', icon: 'close' },
      { label: 'Response rate', value: `${responseRate()}%`, foot: 'Applications with a response', icon: 'trend' }
    ];
  }
  function primaryActionFor(app) {
    const candidates = [];
    if (app.next_followup) candidates.push({ date: app.next_followup, label: 'Follow up', kind: 'followup' });
    if (app.deadline) candidates.push({ date: app.deadline, label: 'Deadline', kind: 'deadline' });
    state.db.reminders.filter(r => r.application_id === app.id && !r.completed && r.reminder_date).forEach(r => candidates.push({ date: r.reminder_date, label: r.reminder_type || 'Reminder', kind: 'reminder' }));
    state.db.application_events.filter(ev => ev.application_id === app.id && ev.event_date && diffDays(ev.event_date, new Date()) >= 0 && /interview|test|deadline|meet/i.test(`${ev.event_type} ${ev.title}`)).forEach(ev => candidates.push({ date: ev.event_date, label: ev.title || ev.event_type, kind: 'event' }));
    candidates.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return candidates[0] || null;
  }
  function getUpcomingActions({ includePast = true, maxDays = 30 } = {}) {
    const today = localDate(); const end = localDate(addDays(new Date(), maxDays));
    const values = [];
    const exists = new Set();
    function add(item) {
      const k = `${item.application_id}|${item.kind}|${item.date}|${item.title}`;
      if (!exists.has(k)) { exists.add(k); values.push(item); }
    }
    state.db.applications.forEach(app => {
      if (TERMINAL.has(app.status)) return;
      const company = appCompanyName(app);
      if (app.next_followup && (includePast ? app.next_followup <= end : app.next_followup >= today && app.next_followup <= end)) add({ application_id: app.id, date: app.next_followup, title: `Follow up ${company}`, sub: app.job_title, kind: 'followup' });
      if (app.deadline && (includePast ? app.deadline <= end : app.deadline >= today && app.deadline <= end)) add({ application_id: app.id, date: app.deadline, title: `Deadline · ${app.job_title}`, sub: company, kind: 'deadline' });
    });
    state.db.reminders.filter(r => !r.completed && r.reminder_date && (includePast ? r.reminder_date <= end : r.reminder_date >= today && r.reminder_date <= end)).forEach(r => {
      const app = getApplication(r.application_id); if (!app) return;
      add({ application_id: app.id, reminder_id: r.id, date: r.reminder_date, title: `${r.reminder_type || 'Reminder'} · ${app.job_title}`, sub: appCompanyName(app), kind: String(r.reminder_type || '').toLowerCase().includes('interview') ? 'interview' : 'reminder' });
    });
    state.db.application_events.forEach(ev => {
      if (!ev.event_date || !(includePast ? ev.event_date <= end : ev.event_date >= today && ev.event_date <= end)) return;
      if (!/interview|technical test|test|deadline|meeting/i.test(`${ev.event_type} ${ev.title}`)) return;
      const app = getApplication(ev.application_id); if (!app || TERMINAL.has(app.status)) return;
      add({ application_id: app.id, event_id: ev.id, date: ev.event_date, title: ev.title || ev.event_type, sub: `${appCompanyName(app)} · ${app.job_title}`, kind: /test/i.test(`${ev.event_type} ${ev.title}`) ? 'test' : 'interview' });
    });
    return values.sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 30);
  }
  function getNeedsAttention() {
    const items = []; const seen = new Set();
    function add(application, type, title, sub, due) {
      const key = `${application.id}:${type}`;
      if (!seen.has(key)) { seen.add(key); items.push({ application_id: application.id, type, title, sub, due }); }
    }
    state.db.applications.forEach(app => {
      if (TERMINAL.has(app.status) || app.status === 'Saved') return;
      const c = appCompanyName(app);
      if (app.next_followup && diffDays(app.next_followup, new Date()) <= 0) add(app, 'overdue', `Follow up ${c}`, `${app.job_title} · ${humanDue(app.next_followup)}`, app.next_followup);
      if (app.deadline && diffDays(app.deadline, new Date()) <= 2) add(app, 'deadline', `Deadline is close`, `${c} · ${humanDue(app.deadline)}`, app.deadline);
      const upcomingInterview = state.db.application_events.find(ev => ev.application_id === app.id && /interview|technical test|test/i.test(`${ev.event_type} ${ev.title}`) && diffDays(ev.event_date, new Date()) >= 0 && diffDays(ev.event_date, new Date()) <= 2);
      if (upcomingInterview) add(app, 'upcoming', upcomingInterview.title || upcomingInterview.event_type, `${c} · ${humanDue(upcomingInterview.event_date)}`, upcomingInterview.event_date);
      const latest = getLatestInteraction(app);
      if (latest && diffDays(new Date(), latest) > 7) add(app, 'stale', `No update for ${diffDays(new Date(), latest)} days`, `${c} · ${app.job_title}`, latest);
    });
    const priority = { overdue: 0, deadline: 1, upcoming: 2, stale: 3 };
    return items.sort((a, b) => (priority[a.type] - priority[b.type]) || String(a.due).localeCompare(String(b.due)));
  }
  function groupCount(items, getter) {
    return items.reduce((out, item) => { const key = getter(item) || 'Unspecified'; out[key] = (out[key] || 0) + 1; return out; }, {});
  }
  function applicationCategory(title) {
    const value = String(title || '').toLowerCase();
    if (/ui\/?ux|product design|designer/.test(value)) return value.includes('graphic') ? 'Graphic design' : 'UI/UX';
    if (/front.?end|web|engineer|developer/.test(value)) return 'Frontend';
    if (/product/.test(value)) return 'Product';
    if (/market|growth|content/.test(value)) return 'Marketing';
    return 'Other';
  }
  function averageResponseDays() {
    const durations = [];
    state.db.applications.forEach(app => {
      if (!app.applied_date) return;
      const firstResponse = state.db.application_events.filter(ev => ev.application_id === app.id && ev.event_date && ev.event_date > app.applied_date && !['Applied', 'Saved'].includes(ev.event_type)).sort((a, b) => a.event_date.localeCompare(b.event_date))[0];
      if (firstResponse) { const days = diffDays(firstResponse.event_date, app.applied_date); if (days >= 0) durations.push(days); }
    });
    return durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
  }
  function analyticsData() {
    const apps = state.db.applications;
    const sent = apps.filter(a => a.status !== 'Saved');
    const interviews = apps.filter(a => ['Interview', 'Technical Test', 'Final Interview', 'Offer', 'Hired'].includes(a.status));
    const offers = apps.filter(a => ['Offer', 'Hired'].includes(a.status));
    const sources = groupCount(apps, a => a.source);
    const bestSource = Object.entries(sources).sort((a, b) => b[1] - a[1])[0];
    return {
      apps, sent, interviews, offers, sources,
      responseRate: responseRate(),
      interviewRate: sent.length ? Math.round(interviews.length / sent.length * 100) : 0,
      offerRate: sent.length ? Math.round(offers.length / sent.length * 100) : 0,
      rejectionRate: sent.length ? Math.round(apps.filter(a => a.status === 'Rejected').length / sent.length * 100) : 0,
      averageResponse: averageResponseDays(),
      bestSource,
      categories: groupCount(apps, a => applicationCategory(a.job_title)),
      locations: groupCount(apps, a => a.work_mode === 'Remote' ? 'Remote' : (a.location || 'Unspecified')),
      salaryRanges: salaryBuckets(apps)
    };
  }
  function salaryBuckets(apps) {
    const buckets = { '< Rp5 jt': 0, 'Rp5–8 jt': 0, 'Rp8–12 jt': 0, 'Rp12–16 jt': 0, '> Rp16 jt': 0, 'Not set': 0 };
    apps.forEach(app => {
      const salary = Number(app.salary_min || app.salary || 0);
      if (!salary) buckets['Not set']++;
      else if (salary < 5000000) buckets['< Rp5 jt']++;
      else if (salary < 8000000) buckets['Rp5–8 jt']++;
      else if (salary < 12000000) buckets['Rp8–12 jt']++;
      else if (salary < 16000000) buckets['Rp12–16 jt']++;
      else buckets['> Rp16 jt']++;
    });
    return buckets;
  }

  // ---------- Shell render ----------
  function navItem(view, label, ic) {
    const isActive = state.view === view || (view === 'applications' && state.view === 'detail');
    return `<button class="nav-item ${isActive ? 'active' : ''}" data-action="navigate" data-view="${view}">${icon(ic, 'nav-icon')}<span>${label}</span></button>`;
  }
  function renderSidebar() {
    return `<aside class="sidebar ${state.sidebarOpen ? 'open' : ''}" aria-label="Main navigation">
      <button class="brand" data-action="navigate" data-view="dashboard" aria-label="JobTrack dashboard"><span class="brand-mark">J</span><span class="brand-name">JobTrack</span><span class="brand-tag">PERSONAL</span></button>
      <span class="nav-label">Workspace</span>
      <nav class="sidebar-nav">
        ${navItem('dashboard', 'Dashboard', 'dashboard')}
        ${navItem('applications', 'Applications', 'applications')}
        ${navItem('calendar', 'Calendar', 'calendar')}
        ${navItem('companies', 'Companies', 'company')}
        ${navItem('analytics', 'Analytics', 'analytics')}
        ${navItem('saved', 'Saved Jobs', 'bookmark')}
      </nav>
      <div class="sidebar-bottom">
        <span class="nav-label">Preferences</span>
        <nav class="sidebar-nav">${navItem('settings', 'Settings', 'settings')}</nav>
        ${hasSeedData() ? `<div class="sidebar-help"><b>Demo workspace</b><span>Sample applications are clearly marked and can be removed anytime.</span><button data-action="clear-demo">Clear demo data</button></div>` : ''}
        <div class="user-card">
          <span class="avatar">AM</span><div class="user-details"><b>Arif Mahendra</b><span>Personal workspace</span></div>
          <button class="user-more" data-action="toggle-profile" aria-label="Profile menu">${icon('more')}</button>
        </div>
      </div>
    </aside>`;
  }
  function renderSearchPopover() {
    const query = state.globalQuery.trim().toLowerCase();
    if (!state.globalOpen || !query) return '';
    const results = state.db.applications.filter(app => {
      const haystack = [appCompanyName(app), app.job_title, app.recruiter_name, app.notes].join(' ').toLowerCase();
      return haystack.includes(query);
    }).slice(0, 6);
    return `<div class="popover search-results" role="listbox">${results.length ? results.map(app => `<button class="search-result" data-action="open-detail" data-id="${app.id}"><span class="mini-avatar">${e(initials(appCompanyName(app)))}</span><span class="search-result-info"><b>${e(app.job_title)} · ${e(appCompanyName(app))}</b><span>${e(app.status)} · ${e(app.source || 'No source')}</span></span></button>`).join('') : '<div class="popover-empty">No applications match this search.</div>'}</div>`;
  }
  function renderNotifications() {
    if (!state.notificationOpen) return '';
    const notifications = getUpcomingActions({ includePast: true, maxDays: 2 }).filter(x => diffDays(x.date, new Date()) <= 1).slice(0, 8);
    return `<div class="popover" style="right: 84px; top: 58px;" role="dialog" aria-label="Reminders"><div class="popover-header"><b>Reminders</b><span style="color:var(--text-faint);font-size:10px">${notifications.length ? `${notifications.length} due` : 'All clear'}</span></div><div class="popover-body">${notifications.length ? notifications.map(item => `<button class="notification-item" data-action="open-detail" data-id="${item.application_id}"><b>${e(item.title)}</b><span>${e(item.sub)} · ${e(humanDue(item.date))}</span></button>`).join('') : '<div class="popover-empty">No reminders due today or tomorrow.</div>'}</div></div>`;
  }
  function renderProfilePopover() {
    if (!state.profileOpen) return '';
    const dark = state.db.meta.theme === 'dark';
    return `<div class="popover" style="right: 22px; top: 58px; min-width:220px"><div class="popover-body"><button class="notification-item" data-action="navigate" data-view="settings"><b>Workspace settings</b><span>Theme, export, and data controls</span></button><button class="notification-item" data-action="toggle-theme"><b>${dark ? 'Use light mode' : 'Use dark mode'}</b><span>Switch the workspace appearance</span></button></div></div>`;
  }
  function renderQuickFilter() {
    if (!state.quickFilterOpen) return '';
    return `<div class="popover" style="top:58px; right:148px; min-width:300px"><div class="popover-header"><b>Quick filters</b><button class="btn btn-quiet btn-sm" data-action="clear-filters">Clear</button></div><div class="popover-body" style="padding:12px"><div class="form-grid"><div class="field"><label>Status</label><select data-filter="status">${selectOptions(STATUS_OPTIONS, state.filters.status, 'All statuses')}</select></div><div class="field"><label>Source</label><select data-filter="source">${selectOptions(SOURCES, state.filters.source, 'All sources')}</select></div><div class="field"><label>Priority</label><select data-filter="priority">${selectOptions(PRIORITIES, state.filters.priority, 'All priorities')}</select></div><div class="field"><label>Job type</label><select data-filter="jobType">${selectOptions(JOB_TYPES, state.filters.jobType, 'All types')}</select></div></div></div></div>`;
  }
  function renderTopbar() {
    const dueCount = getUpcomingActions({ includePast: true, maxDays: 2 }).filter(x => diffDays(x.date, new Date()) <= 1).length;
    return `<header class="topbar">
      <button class="icon-button mobile-menu" data-action="toggle-sidebar" aria-label="Open navigation">${icon('menu')}</button>
      <div class="global-search"><span>${icon('search')}</span><input data-global-search placeholder="Search company, role, recruiter, notes…" value="${attr(state.globalQuery)}" aria-label="Global search"/><span class="shortcut">⌘ K</span>${renderSearchPopover()}</div>
      <div class="top-actions">
        <button class="icon-button hide-mobile" data-action="toggle-quick-filter" aria-label="Open filters">${icon('filter')}</button>
        <button class="icon-button" data-action="toggle-notifications" aria-label="Reminders">${icon('bell')}${dueCount ? '<i class="notification-dot"></i>' : ''}</button>
        <button class="btn btn-primary" data-action="open-application-modal">${icon('plus')}<span class="add-word">Add Application</span></button>
        <button class="avatar hide-mobile" style="border:0;cursor:pointer" data-action="toggle-profile" aria-label="Profile">AM</button>
      </div>
      ${renderNotifications()}${renderProfilePopover()}${renderQuickFilter()}
    </header>`;
  }
  function renderLoading() {
    return `<main class="page"><div class="page-header"><div><div class="skeleton" style="width:170px;height:28px;border-radius:6px"></div><div class="skeleton" style="width:260px;height:14px;border-radius:5px;margin-top:9px"></div></div></div><div class="metrics-grid">${Array.from({ length: 6 }, () => '<div class="metric-card skeleton"></div>').join('')}</div><div class="card skeleton" style="height:255px"></div></main>`;
  }
  function renderApp() {
    document.documentElement.dataset.theme = state.db.meta.theme || 'light';
    appRoot.innerHTML = `<div class="shell">${renderSidebar()}<div class="main-wrap">${renderTopbar()}${state.loading ? renderLoading() : renderPage()}</div></div>`;
    if (state.globalOpen && state.globalQuery) requestAnimationFrame(() => { const node = appRoot.querySelector('[data-global-search]'); if (node) { node.focus(); node.setSelectionRange(node.value.length, node.value.length); } });
  }
  function renderPage() {
    switch (state.view) {
      case 'dashboard': return renderDashboard();
      case 'applications': return renderApplications();
      case 'calendar': return renderCalendar();
      case 'companies': return renderCompanies();
      case 'analytics': return renderAnalytics();
      case 'saved': return renderSavedJobs();
      case 'settings': return renderSettings();
      case 'detail': return renderDetail();
      default: return renderDashboard();
    }
  }

  // ---------- Reusable fragments ----------
  function selectOptions(options, current, placeholder = 'Select…') {
    return `<option value="">${e(placeholder)}</option>${options.map(x => `<option value="${attr(x)}" ${selected(current, x)}>${e(x)}</option>`).join('')}`;
  }
  function statusBadge(status) { return `<span class="status-badge ${statusClass(status)}">${e(status || 'Saved')}</span>`; }
  function priorityBadge(priority) { return `<span class="priority-badge priority-${e(priority || 'Medium')}">${e(priority || 'Medium')}</span>`; }
  function sourceLabel(source) { return `<span class="source"><i class="source-dot" style="--source-color:${sourceColor(source)}"></i>${e(source || 'Other')}</span>`; }
  function demoBanner() {
    if (!hasSeedData()) return '';
    return `<div class="demo-banner">${icon('info')}<span><b>Demo data is active.</b> These sample applications are here for preview only and are included in every metric.</span><span class="demo-actions"><button class="inline-link" data-action="clear-demo">Remove demo data</button></span></div>`;
  }
  function noAppsEmpty() {
    return `<div class="empty-state"><div class="empty-icon">${icon('briefcase')}</div><h3>No applications yet.</h3><p>Start tracking your job search in one focused place. Your dashboard, reminders, and analytics will update automatically.</p><button class="btn btn-primary" data-action="open-application-modal">${icon('plus')} Add your first application</button></div>`;
  }
  function actionList(items, emptyText = 'No upcoming actions.') {
    if (!items.length) return `<div class="empty-inline">${icon('check')}<div>${e(emptyText)}</div></div>`;
    return `<div class="action-list">${items.map(item => `<button class="action-item" data-action="open-detail" data-id="${item.application_id}"><i class="action-marker ${item.type === 'overdue' || (item.date && diffDays(item.date, new Date()) < 0) ? 'overdue' : (item.type === 'upcoming' || item.kind === 'interview' ? 'upcoming' : '')}"></i><span class="action-content"><b>${e(item.title)}</b><span>${e(item.sub || '')}</span></span><span class="action-date">${e(humanDue(item.date || item.due))}</span></button>`).join('')}</div>`;
  }
  function card(title, body, opts = {}) {
    return `<section class="card ${opts.className || ''}"><div class="card-header"><div><h2 class="card-title">${e(title)}</h2>${opts.subtitle ? `<div class="card-subtitle">${e(opts.subtitle)}</div>` : ''}</div>${opts.action || ''}</div>${body}</section>`;
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    const metrics = dashboardMetrics();
    const pipeline = PIPELINE_STATUSES.map(status => ({ status, count: state.db.applications.filter(a => a.status === status).length }));
    const recent = [...state.db.applications].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 6);
    const actions = getUpcomingActions({ includePast: true, maxDays: 21 }).slice(0, 5);
    const attention = getNeedsAttention().slice(0, 5);
    const insights = renderInsights();
    return `<main class="page">
      <div class="page-header"><div><h1 class="page-title">Good to see you, Arif.</h1><p class="page-subtitle">Your job search, organized. Here is the current picture.</p></div><div class="page-header-actions"><button class="btn" data-action="navigate" data-view="analytics">${icon('analytics')} View analytics</button><button class="btn btn-primary" data-action="open-application-modal">${icon('plus')} Add application</button></div></div>
      ${demoBanner()}
      <section class="metrics-grid">${metrics.map(m => `<article class="metric-card"><div class="metric-label"><span>${e(m.label)}</span>${icon(m.icon)}</div><div class="metric-value">${e(m.value)}</div><div class="metric-foot">${e(m.foot)}</div></article>`).join('')}</section>
      ${state.db.applications.length ? `<div class="dashboard-grid"><div class="stack">
        ${card('Application pipeline', `<div class="pipeline-wrap"><div class="pipeline">${pipeline.map(x => `<button class="pipeline-stage ${x.count ? 'active' : ''}" data-action="filter-status" data-status="${attr(x.status)}"><span class="p-count">${x.count}</span><span class="p-name">${e(x.status)}</span></button>`).join('')}</div></div>`, { subtitle: 'Live count by current stage', action: '<button class="card-link" data-action="navigate" data-view="applications">Manage applications</button>' })}
        ${renderRecentApplications(recent)}
      </div><aside class="stack">
        ${card('Upcoming actions', actionList(actions), { subtitle: 'Based on real reminders and dates', action: '<button class="card-link" data-action="navigate" data-view="calendar">Open calendar</button>' })}
        ${card('Needs attention', actionList(attention, 'Nothing needs attention right now.'), { subtitle: 'Overdue, stale, or time-sensitive' })}
        ${card('Job search insights', insights, { subtitle: 'Calculated from your records' })}
      </aside></div>` : noAppsEmpty()}
    </main>`;
  }
  function renderRecentApplications(apps) {
    const body = apps.length ? `<div class="table-wrap"><table><thead><tr><th>Company / role</th><th>Source</th><th>Applied</th><th>Status</th><th>Next action</th><th>Salary</th><th>Updated</th></tr></thead><tbody>${apps.map(app => {
      const next = primaryActionFor(app);
      return `<tr class="clickable" data-action="open-detail" data-id="${app.id}"><td><div class="company-cell"><span class="mini-avatar">${e(initials(appCompanyName(app)))}</span><span>${e(appCompanyName(app))}<small>${e(app.job_title)}</small></span></div></td><td>${sourceLabel(app.source)}</td><td>${e(formatShortDate(app.applied_date))}</td><td>${statusBadge(app.status)}</td><td>${next ? `<span title="${attr(next.label)}">${e(next.label)}<br><small style="color:var(--text-faint)">${e(humanDue(next.date))}</small></span>` : '—'}</td><td>${e(salaryLabel(app))}</td><td>${e(formatShortDate(getLatestInteraction(app)))}</td></tr>`;
    }).join('')}</tbody></table></div>` : '<div class="empty-inline">No applications yet.</div>';
    return card('Recent applications', body, { subtitle: 'Most recently updated', action: '<button class="card-link" data-action="navigate" data-view="applications">View all</button>' });
  }
  function renderInsights() {
    const data = analyticsData();
    if (!data.apps.length) return '<div class="empty-inline">Insights appear once applications are added.</div>';
    const best = data.bestSource;
    const categories = Object.entries(data.categories).sort((a, b) => b[1] - a[1]);
    const thisMonth = state.db.applications.filter(a => a.applied_date && toDate(a.applied_date).getMonth() === new Date().getMonth() && toDate(a.applied_date).getFullYear() === new Date().getFullYear()).length;
    const lines = [
      `<b>${thisMonth} application${thisMonth === 1 ? '' : 's'}</b> sent this month.`,
      best ? `<b>${e(best[0])}</b> is your most-used source with ${best[1]} application${best[1] === 1 ? '' : 's'}.` : 'Add a source to compare channels.',
      data.averageResponse !== null ? `<b>${data.averageResponse.toFixed(1)} days</b> average time to first response.` : 'Response time will appear after the first response is logged.',
      categories[0] ? `Most applications are for <b>${e(categories[0][0])}</b> roles.` : ''
    ].filter(Boolean);
    return `<div class="insight-list">${lines.slice(0, 4).map((line, index) => `<div class="insight-item"><span class="insight-icon">${icon(['trend', 'target', 'clock', 'briefcase'][index])}</span><span class="insight-text">${line}</span></div>`).join('')}</div>`;
  }

  // ---------- Applications ----------
  function filteredApplications() {
    const f = state.filters;
    let apps = [...state.db.applications];
    const query = f.search.trim().toLowerCase();
    if (query) apps = apps.filter(a => [appCompanyName(a), a.job_title, a.recruiter_name, a.notes].join(' ').toLowerCase().includes(query));
    if (f.status) apps = apps.filter(a => a.status === f.status);
    if (f.source) apps = apps.filter(a => a.source === f.source);
    if (f.jobType) apps = apps.filter(a => a.job_type === f.jobType);
    if (f.workMode) apps = apps.filter(a => a.work_mode === f.workMode);
    if (f.priority) apps = apps.filter(a => a.priority === f.priority);
    if (f.company) apps = apps.filter(a => a.company_id === f.company);
    if (f.minSalary) apps = apps.filter(a => Number(a.salary_max || a.salary_min || 0) >= Number(f.minSalary));
    if (f.maxSalary) apps = apps.filter(a => Number(a.salary_min || 0) <= Number(f.maxSalary));
    if (f.after) apps = apps.filter(a => a.applied_date && a.applied_date >= f.after);
    if (f.before) apps = apps.filter(a => a.applied_date && a.applied_date <= f.before);
    const sorters = {
      newest: (a, b) => String(b.applied_date || b.created_at).localeCompare(String(a.applied_date || a.created_at)),
      oldest: (a, b) => String(a.applied_date || a.created_at).localeCompare(String(b.applied_date || b.created_at)),
      updated: (a, b) => String(b.updated_at).localeCompare(String(a.updated_at)),
      salary: (a, b) => Number(b.salary_max || b.salary_min || 0) - Number(a.salary_max || a.salary_min || 0),
      deadline: (a, b) => { const ad = a.deadline || '9999-12-31'; const bd = b.deadline || '9999-12-31'; return ad.localeCompare(bd); }
    };
    return apps.sort(sorters[f.sort] || sorters.newest);
  }
  function renderToolbar() {
    const f = state.filters;
    return `<div class="toolbar"><div class="segmented"><button class="${state.appViewMode === 'table' ? 'active' : ''}" data-action="set-app-view" data-mode="table">${icon('table')} Table</button><button class="${state.appViewMode === 'kanban' ? 'active' : ''}" data-action="set-app-view" data-mode="kanban">${icon('columns')} Kanban</button></div><span class="toolbar-spacer"></span><div class="toolbar-search">${icon('search')}<input class="input" data-filter="search" value="${attr(f.search)}" placeholder="Search applications"/></div><select class="filter-select" data-filter="status">${selectOptions(STATUS_OPTIONS, f.status, 'All statuses')}</select><select class="filter-select" data-filter="source">${selectOptions(SOURCES, f.source, 'All sources')}</select><select class="filter-select" data-filter="priority">${selectOptions(PRIORITIES, f.priority, 'Priority')}</select><button class="btn btn-sm" data-action="open-advanced-filter">${icon('filter')} More</button><select class="filter-select" data-filter="sort"><option value="newest" ${selected(f.sort,'newest')}>Newest</option><option value="oldest" ${selected(f.sort,'oldest')}>Oldest</option><option value="updated" ${selected(f.sort,'updated')}>Recently updated</option><option value="salary" ${selected(f.sort,'salary')}>Highest salary</option><option value="deadline" ${selected(f.sort,'deadline')}>Upcoming deadline</option></select>${Object.values(f).some(v => v && v !== 'newest') ? '<button class="btn btn-quiet btn-sm" data-action="clear-filters">Clear</button>' : ''}</div>`;
  }
  function renderApplications() {
    const apps = filteredApplications();
    return `<main class="page"><div class="page-header"><div><h1 class="page-title">Applications</h1><p class="page-subtitle">Every opportunity, from saved role to signed offer.</p></div><div class="page-header-actions"><button class="btn btn-primary" data-action="open-application-modal">${icon('plus')} Add application</button></div></div>${renderToolbar()}<div class="results-count" style="margin:-5px 0 12px">${apps.length} of ${state.db.applications.length} application${state.db.applications.length === 1 ? '' : 's'}</div>${state.db.applications.length ? (state.appViewMode === 'kanban' ? renderKanban(apps) : renderApplicationTable(apps)) : noAppsEmpty()}</main>`;
  }
  function renderApplicationTable(apps) {
    if (!apps.length) return `<div class="empty-state"><div class="empty-icon">${icon('search')}</div><h3>No matching applications.</h3><p>Try changing or clearing your filters to see more records.</p><button class="btn" data-action="clear-filters">Clear filters</button></div>`;
    return `<section class="card applications-table"><div class="table-wrap"><table><thead><tr><th>Position</th><th>Company</th><th>Source</th><th>Applied date</th><th>Status</th><th>Priority</th><th>Salary</th><th>Next action</th><th></th></tr></thead><tbody>${apps.map(app => {
      const next = primaryActionFor(app);
      return `<tr class="clickable" data-action="open-detail" data-id="${app.id}"><td><span class="position-title">${e(app.job_title)}</span><span class="sub-position">${e(app.job_type || 'Type not set')} · ${e(app.work_mode || app.location || 'Location not set')}</span></td><td><div class="company-cell"><span class="mini-avatar">${e(initials(appCompanyName(app)))}</span><span>${e(appCompanyName(app))}</span></div></td><td>${sourceLabel(app.source)}</td><td>${e(formatShortDate(app.applied_date))}</td><td>${statusBadge(app.status)}</td><td>${priorityBadge(app.priority)}</td><td>${e(salaryLabel(app))}</td><td>${next ? `<span style="font-size:11px;color:var(--text)">${e(next.label)}<small style="display:block;color:var(--text-faint);margin-top:2px">${e(humanDue(next.date))}</small></span>` : '—'}</td><td><div class="row-actions"><button class="icon-button" data-action="open-detail" data-id="${app.id}" aria-label="Open application">${icon('chevronRight')}</button></div></td></tr>`;
    }).join('')}</tbody></table></div></section>`;
  }
  function renderKanban(filtered) {
    const filteredIds = new Set(filtered.map(a => a.id));
    return `<div class="kanban-board">${STATUS_OPTIONS.map(status => {
      const items = state.db.applications.filter(a => a.status === status && filteredIds.has(a.id));
      return `<section class="kanban-column" data-kanban-status="${attr(status)}"><header class="kanban-column-header">${statusBadge(status)}<span class="kanban-count">${items.length}</span></header><div class="kanban-cards">${items.length ? items.map(app => renderKanbanCard(app)).join('') : '<div class="drag-hint">Drop an application here</div>'}</div></section>`;
    }).join('')}</div>`;
  }
  function renderKanbanCard(app) {
    const next = primaryActionFor(app);
    return `<article class="kanban-card" draggable="true" data-app-id="${app.id}"><div class="kanban-card-top"><div><div class="kanban-title">${e(app.job_title)}</div><div class="kanban-company">${e(appCompanyName(app))}</div></div>${priorityBadge(app.priority)}</div><div class="kanban-meta"><div class="kanban-meta-row">${sourceLabel(app.source)}<span>${e(formatShortDate(app.applied_date))}</span></div>${salaryLabel(app) !== '—' ? `<div class="kanban-meta-row"><span>${e(salaryLabel(app))}</span><span></span></div>` : ''}${next ? `<div class="kanban-meta-row"><span>${e(next.label)}</span><span>${e(humanDue(next.date))}</span></div>` : ''}${app.deadline ? `<div class="kanban-meta-row"><span>Deadline</span><span>${e(formatShortDate(app.deadline))}</span></div>` : ''}</div></article>`;
  }

  // ---------- Calendar ----------
  function getCalendarEvents() {
    const out = []; const seen = new Set();
    function push(item) { const key = `${item.appId}|${item.date}|${item.title}|${item.type}`; if (!seen.has(key) && item.date) { seen.add(key); out.push(item); } }
    state.db.applications.forEach(app => {
      if (app.next_followup) push({ id: `follow_${app.id}`, appId: app.id, date: app.next_followup, title: `Follow up · ${appCompanyName(app)}`, type: 'followup' });
      if (app.deadline) push({ id: `deadline_${app.id}`, appId: app.id, date: app.deadline, title: `Deadline · ${app.job_title}`, type: 'deadline' });
    });
    state.db.reminders.filter(r => !r.completed).forEach(r => {
      const app = getApplication(r.application_id); if (app) push({ id: r.id, appId: app.id, date: r.reminder_date, title: `${r.reminder_type || 'Reminder'} · ${app.job_title}`, type: /interview/i.test(r.reminder_type) ? 'interview' : 'followup' });
    });
    state.db.application_events.forEach(ev => {
      const app = getApplication(ev.application_id); if (!app) return;
      const raw = `${ev.event_type} ${ev.title}`.toLowerCase();
      const type = raw.includes('interview') ? 'interview' : raw.includes('test') ? 'test' : raw.includes('deadline') ? 'deadline' : 'event';
      push({ id: ev.id, appId: app.id, date: ev.event_date, title: ev.title || ev.event_type, type });
    });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }
  function renderCalendar() {
    const month = state.calendarDate;
    const start = new Date(month); start.setDate(1 - start.getDay());
    const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    const events = getCalendarEvents();
    const monthEvents = events.filter(x => { const d = toDate(x.date); return d && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); });
    const nextEvents = events.filter(x => diffDays(x.date, new Date()) >= 0).slice(0, 7);
    return `<main class="page"><div class="page-header"><div><h1 class="page-title">Calendar</h1><p class="page-subtitle">Interviews, follow-ups, tests, and deadlines in one view.</p></div><div class="page-header-actions"><button class="btn btn-primary" data-action="open-event-modal">${icon('plus')} Add timeline event</button></div></div><div class="calendar-layout"><section class="card calendar-card"><div class="calendar-header"><b class="calendar-title">${e(formatMonth(month))}</b><div class="calendar-control"><button class="icon-button" data-action="calendar-previous" aria-label="Previous month">${icon('chevronLeft')}</button><button class="btn btn-sm" data-action="calendar-today">Today</button><button class="icon-button" data-action="calendar-next" aria-label="Next month">${icon('chevronRight')}</button></div></div><div class="calendar-weekdays"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div><div class="calendar-grid">${cells.map(date => {
      const iso = localDate(date); const cellEvents = events.filter(item => item.date === iso); const isCurrent = date.getMonth() === month.getMonth();
      return `<div class="calendar-day ${isCurrent ? '' : 'muted'} ${isSameDay(date, new Date()) ? 'today' : ''}"><span class="day-number">${date.getDate()}</span>${cellEvents.slice(0, 3).map(ev => `<button class="calendar-event ${e(ev.type)}" title="${attr(ev.title)}" data-action="open-detail" data-id="${ev.appId}">${e(ev.title)}</button>`).join('')}${cellEvents.length > 3 ? `<button class="calendar-more" data-action="open-day-events" data-date="${iso}">+${cellEvents.length - 3} more</button>` : ''}</div>`;
    }).join('')}</div><div class="calendar-legend"><span><i class="legend-dot" style="background:var(--accent)"></i>Activity</span><span><i class="legend-dot" style="background:var(--success)"></i>Interview</span><span><i class="legend-dot" style="background:var(--violet)"></i>Test</span><span><i class="legend-dot" style="background:var(--warning)"></i>Follow-up</span><span><i class="legend-dot" style="background:var(--danger)"></i>Deadline</span></div></section><aside class="card calendar-side"><div class="card-header"><div><h2 class="card-title">Upcoming</h2><div class="card-subtitle">Your next scheduled items</div></div></div><div class="calendar-side-list">${nextEvents.length ? nextEvents.map(ev => `<button class="calendar-side-item" data-action="open-detail" data-id="${ev.appId}"><span class="calendar-side-date">${e(formatShortDate(ev.date))}</span><span class="calendar-side-info"><b>${e(ev.title)}</b><span>${e(appCompanyName(getApplication(ev.appId)))}</span></span></button>`).join('') : '<div class="empty-inline">No future events yet.</div>'}</div></aside></div></main>`;
  }

  // ---------- Analytics ----------
  function weeklySeries() {
    const today = startOfDay(); const monday = addDays(today, -((today.getDay() + 6) % 7));
    return Array.from({ length: 8 }, (_, i) => { const start = addDays(monday, -7 * (7 - i)); const end = addDays(start, 6); return { label: formatDate(start, { day: 'numeric', month: 'short' }), count: state.db.applications.filter(a => a.applied_date && toDate(a.applied_date) >= start && toDate(a.applied_date) <= end).length }; });
  }
  function barChart(items, color = 'var(--accent)') {
    const max = Math.max(...items.map(x => x.count), 1);
    return `<div class="chart-area">${items.map(item => `<div class="bar-col"><span class="bar-value">${item.count || ''}</span><i class="bar" style="height:${Math.max(item.count ? (item.count / max) * 80 : 1, 1)}%;background:${color}"></i><span class="bar-label" title="${attr(item.label)}">${e(item.label)}</span></div>`).join('')}</div>`;
  }
  function distribution(items, color = 'var(--accent)') {
    const max = Math.max(...items.map(x => x[1]), 1);
    return `<div class="distribution">${items.length ? items.map(([label, count]) => `<div class="distribution-row"><label title="${attr(label)}">${e(label)}</label><div class="track"><div class="fill" style="width:${(count / max) * 100}%;background:${color}"></div></div><span>${count}</span></div>`).join('') : '<div class="empty-inline">No data yet.</div>'}</div>`;
  }
  function renderAnalytics() {
    const data = analyticsData();
    const sourceEntries = Object.entries(data.sources).sort((a, b) => b[1] - a[1]);
    const categoryEntries = Object.entries(data.categories).sort((a, b) => b[1] - a[1]);
    const locationEntries = Object.entries(data.locations).sort((a, b) => b[1] - a[1]);
    const salaryEntries = Object.entries(data.salaryRanges);
    const monthlyApps = state.db.applications.filter(a => a.applied_date && toDate(a.applied_date).getMonth() === new Date().getMonth() && toDate(a.applied_date).getFullYear() === new Date().getFullYear()).length;
    const avgWeek = state.db.applications.length ? (weeklySeries().reduce((sum, x) => sum + x.count, 0) / 8).toFixed(1) : '0';
    const insights = [];
    if (data.bestSource) {
      const sourceInterviews = state.db.applications.filter(a => a.source === data.bestSource[0] && ['Interview', 'Technical Test', 'Final Interview', 'Offer', 'Hired'].includes(a.status)).length;
      insights.push(`${data.bestSource[0]} generated ${data.bestSource[1]} application${data.bestSource[1] === 1 ? '' : 's'}${sourceInterviews ? ` and ${sourceInterviews} interview${sourceInterviews === 1 ? '' : 's'}` : ''}.`);
    }
    if (data.averageResponse !== null) insights.push(`Average response time: ${data.averageResponse.toFixed(1)} days.`);
    if (categoryEntries[0]) insights.push(`Most applications are for ${categoryEntries[0][0]} roles.`);
    return `<main class="page"><div class="page-header"><div><h1 class="page-title">Analytics</h1><p class="page-subtitle">Useful signals calculated only from your tracked applications.</p></div><div class="page-header-actions"><button class="btn" data-action="export-data">${icon('download')} Export data</button></div></div>${!data.apps.length ? noAppsEmpty() : `<section class="metrics-grid" style="grid-template-columns:repeat(5,minmax(0,1fr))"><article class="metric-card"><div class="metric-label">Applications this month</div><div class="metric-value">${monthlyApps}</div><div class="metric-foot">From applied dates</div></article><article class="metric-card"><div class="metric-label">Interview conversion</div><div class="metric-value">${data.interviewRate}%</div><div class="metric-foot">Of submitted applications</div></article><article class="metric-card"><div class="metric-label">Offer conversion</div><div class="metric-value">${data.offerRate}%</div><div class="metric-foot">Of submitted applications</div></article><article class="metric-card"><div class="metric-label">Average per week</div><div class="metric-value">${avgWeek}</div><div class="metric-foot">Last 8 weeks</div></article><article class="metric-card"><div class="metric-label">Active opportunities</div><div class="metric-value">${activeApplications().length}</div><div class="metric-foot">Not closed or saved</div></article></section><div class="analytics-grid">${card('Applications per week', barChart(weeklySeries()), { subtitle: 'Based on date applied' })}${card('Applications by platform', distribution(sourceEntries), { subtitle: 'Where roles are coming from' })}${card('Conversion metrics', `<div class="kpi-list"><div class="kpi-row"><span>Response rate</span><b>${data.responseRate}%</b></div><div class="kpi-row"><span>Interview conversion</span><b>${data.interviewRate}%</b></div><div class="kpi-row"><span>Offer conversion</span><b>${data.offerRate}%</b></div><div class="kpi-row"><span>Rejection rate</span><b>${data.rejectionRate}%</b></div><div class="kpi-row"><span>Avg. days before response</span><b>${data.averageResponse === null ? '—' : `${data.averageResponse.toFixed(1)}d`}</b></div></div>`, { subtitle: 'Actual application outcomes' })}${card('Roles by category', distribution(categoryEntries, 'var(--violet)'), { subtitle: 'Inferred from job titles' })}${card('Salary distribution', distribution(salaryEntries, 'var(--success)'), { subtitle: 'Using listed minimum salary' })}${card('Job Search Insights', `<div class="insight-list">${insights.length ? insights.map((text, i) => `<div class="insight-item"><span class="insight-icon">${icon(['target','clock','briefcase'][i])}</span><span class="insight-text">${e(text)}</span></div>`).join('') : '<div class="empty-inline">Add applications to see calculated insights.</div>'}</div>`, { subtitle: 'No estimated or invented results' })}</div>`}</main>`;
  }

  // ---------- Companies ----------
  function companiesWithStats() {
    return state.db.companies.map(company => {
      const apps = state.db.applications.filter(a => a.company_id === company.id);
      const recent = apps.map(getLatestInteraction).filter(Boolean).sort().reverse()[0];
      const current = apps.filter(a => !TERMINAL.has(a.status)).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0];
      return { company, apps, recent, current };
    }).filter(item => item.apps.length || item.company.name).sort((a, b) => (b.apps.length - a.apps.length) || a.company.name.localeCompare(b.company.name));
  }
  function renderCompanies() {
    const records = companiesWithStats();
    return `<main class="page"><div class="page-header"><div><h1 class="page-title">Companies</h1><p class="page-subtitle">See every touchpoint and opportunity by company.</p></div><div class="page-header-actions"><button class="btn btn-primary" data-action="open-application-modal">${icon('plus')} Add application</button></div></div>${records.length ? `<section class="company-grid">${records.map(({ company, apps, recent, current }) => `<button class="company-card" data-action="open-company" data-id="${company.id}"><span class="company-card-head"><span class="avatar company">${e(initials(company.name))}</span><span><h3>${e(company.name)}</h3><span class="company-industry">${e(company.industry || 'Industry not set')} · ${e(company.location || 'Location not set')}</span></span></span><span class="company-stat-grid"><span class="company-stat"><b>${apps.length}</b><span>application${apps.length === 1 ? '' : 's'}</span></span><span class="company-stat"><b>${current ? e(current.status) : '—'}</b><span>current status</span></span></span><span class="company-card-foot"><span>Last interaction: ${e(recent ? formatShortDate(recent) : '—')}</span>${icon('chevronRight')}</span></button>`).join('')}</section>` : `<div class="empty-state"><div class="empty-icon">${icon('company')}</div><h3>No companies yet.</h3><p>Companies are created automatically when you add your first application.</p><button class="btn btn-primary" data-action="open-application-modal">${icon('plus')} Add application</button></div>`}</main>`;
  }

  // ---------- Saved jobs ----------
  function renderSavedJobs() {
    const jobs = [...state.db.saved_jobs].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return `<main class="page"><div class="page-header"><div><h1 class="page-title">Saved jobs</h1><p class="page-subtitle">Shortlist opportunities before you are ready to apply.</p></div><div class="page-header-actions"><button class="btn btn-primary" data-action="open-saved-job-modal">${icon('plus')} Save a job</button></div></div>${jobs.length ? `<section class="saved-list">${jobs.map(job => { const company = getCompany(job.company_id); return `<article class="saved-job"><div><div class="saved-job-title">${e(job.job_title)}</div><div class="saved-job-company">${e(company?.name || job.company_name || 'Unknown company')} · ${sourceLabel(job.source)}</div></div><div class="saved-data"><div class="saved-label">Salary</div><div class="saved-value">${e(salaryLabel(job))}</div></div><div class="saved-data"><div class="saved-label">Deadline</div><div class="saved-value">${e(job.deadline ? `${formatShortDate(job.deadline)} · ${humanDue(job.deadline)}` : 'Not set')}</div></div><div class="saved-data"><div class="saved-label">Priority</div><div class="saved-value">${priorityBadge(job.priority || 'Medium')} ${job.status === 'Applied' ? statusBadge('Applied') : ''}</div></div><div class="saved-actions">${job.status === 'Applied' ? `<button class="btn btn-sm" data-action="open-detail" data-id="${job.application_id}">Open application</button>` : `<button class="btn btn-primary btn-sm" data-action="convert-saved-job" data-id="${job.id}">Apply now</button>`}<button class="icon-button" data-action="edit-saved-job" data-id="${job.id}" aria-label="Edit saved job">${icon('edit')}</button><button class="icon-button" data-action="delete-saved-job" data-id="${job.id}" aria-label="Delete saved job">${icon('trash')}</button></div></article>`; }).join('')}</section>` : `<div class="empty-state"><div class="empty-icon">${icon('bookmark')}</div><h3>No saved jobs yet.</h3><p>Save roles you want to review, then turn them into an application when you are ready.</p><button class="btn btn-primary" data-action="open-saved-job-modal">${icon('plus')} Save a job</button></div>`}</main>`;
  }

  // ---------- Detail ----------
  function renderDetail() {
    const app = getApplication(state.detailAppId);
    if (!app) { state.view = 'applications'; return renderApplications(); }
    const company = getCompany(app.company_id) || { name: 'Unknown company' };
    const events = sortedEvents(app.id);
    const reminders = state.db.reminders.filter(r => r.application_id === app.id && !r.completed).sort((a, b) => a.reminder_date.localeCompare(b.reminder_date));
    const attachmentRows = (app.attachments || []).map((x, i) => `<div class="resource-row">${icon('paperclip')}<span>${e(typeof x === 'string' ? x : x.name)}</span><button class="btn btn-quiet btn-sm" data-action="remove-attachment" data-id="${app.id}" data-index="${i}">Remove</button></div>`).join('');
    return `<main class="page detail-page"><button class="back-link" data-action="back-applications">${icon('chevronLeft')} Back to applications</button><section class="detail-header"><div class="detail-identity"><span class="avatar">${e(initials(company.name))}</span><div><div class="detail-eyebrow">${e(company.name)}${company.industry ? ` · ${e(company.industry)}` : ''}</div><h1 class="detail-title">${e(app.job_title)}</h1><div style="margin-top:8px">${statusBadge(app.status)} ${priorityBadge(app.priority)}</div></div></div><div class="detail-actions"><button class="btn" data-action="open-event-modal" data-id="${app.id}">${icon('plus')} Add event</button><button class="btn" data-action="open-application-modal" data-id="${app.id}">${icon('edit')} Edit</button><button class="btn btn-danger" data-action="delete-application" data-id="${app.id}">${icon('trash')} Delete</button></div></section><div class="detail-layout"><div class="detail-stack">${card('Application timeline', `<div class="timeline">${events.length ? events.map(ev => `<div class="timeline-item"><span class="timeline-date">${e(formatDate(ev.event_date))}</span><span class="timeline-track"><i class="timeline-dot"></i></span><span class="timeline-content"><b>${e(ev.title || ev.event_type)}</b>${ev.description ? `<span>${e(ev.description)}</span>` : ''}</span></div>`).join('') : '<div class="empty-inline">No timeline events yet.</div>'}</div>`, { subtitle: 'Add every meaningful touchpoint', action: `<button class="card-link" data-action="open-event-modal" data-id="${app.id}">Add event</button>` })}${card('Job description', `<div class="detail-info"><div class="note-block">${app.job_description ? e(app.job_description) : '<span style="color:var(--text-faint)">No job description added.</span>'}</div></div>`, { action: `<button class="card-link" data-action="open-application-modal" data-id="${app.id}">Edit</button>` })}${card('Requirements', `<div class="detail-info"><div class="note-block">${app.requirements ? e(app.requirements) : '<span style="color:var(--text-faint)">No requirements added.</span>'}</div></div>`, { action: `<button class="card-link" data-action="open-application-modal" data-id="${app.id}">Edit</button>` })}${card('Notes', `<div class="detail-info"><div class="note-block">${app.notes ? e(app.notes) : '<span style="color:var(--text-faint)">No notes added.</span>'}</div></div>`, { action: `<button class="card-link" data-action="open-application-modal" data-id="${app.id}">Edit</button>` })}</div><aside class="detail-stack">${card('Application details', `<div class="detail-info"><div class="info-grid"><div class="info-pair"><label>Applied date</label><div>${e(formatDate(app.applied_date))}</div></div><div class="info-pair"><label>Source</label><div>${sourceLabel(app.source)}</div></div><div class="info-pair"><label>Employment</label><div>${e(app.job_type || '—')}</div></div><div class="info-pair"><label>Work setup</label><div>${e([app.work_mode, app.location].filter(Boolean).join(' · ') || '—')}</div></div><div class="info-pair"><label>Salary</label><div>${e(salaryLabel(app))}</div></div><div class="info-pair"><label>Deadline</label><div>${e(app.deadline ? `${formatDate(app.deadline)} (${humanDue(app.deadline)})` : '—')}</div></div><div class="info-pair"><label>Job URL</label>${app.job_url ? `<a href="${attr(app.job_url)}" target="_blank" rel="noopener">Open job posting ${icon('external')}</a>` : '<div>—</div>'}</div><div class="info-pair"><label>Next follow-up</label><div>${e(app.next_followup ? `${formatDate(app.next_followup)} (${humanDue(app.next_followup)})` : '—')}</div></div></div></div>`)}${card('Recruiter', `<div class="detail-info"><div class="info-grid"><div class="info-pair"><label>Name</label><div>${e(app.recruiter_name || 'Not added')}</div></div><div class="info-pair"><label>Contact</label><div>${e(app.recruiter_contact || 'Not added')}</div></div></div></div>`)}${card('Interview details', `<div class="detail-info"><div class="note-block">${app.interview_details ? e(app.interview_details) : '<span style="color:var(--text-faint)">No interview details added.</span>'}</div></div>`)}${card('Reminders', `<div class="resource-list">${reminders.length ? reminders.map(reminder => `<div class="resource-row">${icon('bell')}<span>${e(reminder.reminder_type || 'Reminder')} · ${e(formatDate(reminder.reminder_date))} (${e(humanDue(reminder.reminder_date))})</span><button class="btn btn-quiet btn-sm" data-action="complete-reminder" data-id="${reminder.id}">Complete</button></div>`).join('') : '<div class="empty-inline">No active reminders.</div>'}</div>`, { action: `<button class="card-link" data-action="open-reminder-modal" data-id="${app.id}">Add reminder</button>` })}${card('Files & materials', `<div class="resource-list">${app.resume_used ? `<div class="resource-row">${icon('file')}<span>Resume · ${e(app.resume_used)}</span></div>` : ''}${app.cover_letter_used ? `<div class="resource-row">${icon('file')}<span>Cover letter · ${e(app.cover_letter_used)}</span></div>` : ''}${attachmentRows || (!app.resume_used && !app.cover_letter_used ? '<div class="empty-inline">No materials attached.</div>' : '')}</div>`, { action: `<button class="card-link" data-action="open-attachment-modal" data-id="${app.id}">Add attachment</button>` })}</aside></div></main>`;
  }

  // ---------- Settings ----------
  function renderSettings() {
    const dark = state.db.meta.theme === 'dark';
    return `<main class="page"><div class="page-header"><div><h1 class="page-title">Settings</h1><p class="page-subtitle">Personalize and manage your JobTrack workspace.</p></div></div><div class="settings-layout"><section class="card"><div class="settings-section"><h2 class="setting-title">Appearance</h2><p class="setting-copy">A quiet workspace that adapts to the way you like to work.</p><div class="setting-row"><div class="setting-row-text"><b>Dark mode</b><span>Use a dark neutral theme across JobTrack.</span></div><button class="toggle ${dark ? 'active' : ''}" data-action="toggle-theme" aria-label="Toggle dark mode"><span></span></button></div></div><div class="settings-section"><h2 class="setting-title">Data</h2><p class="setting-copy">Your records live locally in this browser. Export a backup anytime.</p><div class="setting-row"><div class="setting-row-text"><b>Export workspace</b><span>Download applications, companies, events, saved jobs, and reminders as JSON.</span></div><button class="btn btn-sm" data-action="export-data">${icon('download')} Export</button></div><div class="setting-row"><div class="setting-row-text"><b>Clear demo data</b><span>Remove only clearly marked starter records and retain anything you added.</span></div><button class="btn btn-sm" data-action="clear-demo" ${hasSeedData() ? '' : 'disabled'}>${icon('trash')} Remove</button></div></div></section><aside class="card"><div class="settings-section"><h2 class="setting-title">Workspace summary</h2><p class="setting-copy">Stored locally, without a connected cloud account.</p><div class="kpi-list" style="padding:15px 0 0"><div class="kpi-row"><span>Applications</span><b>${state.db.applications.length}</b></div><div class="kpi-row"><span>Companies</span><b>${state.db.companies.length}</b></div><div class="kpi-row"><span>Timeline events</span><b>${state.db.application_events.length}</b></div><div class="kpi-row"><span>Active reminders</span><b>${state.db.reminders.filter(r=>!r.completed).length}</b></div></div></div><div class="settings-section"><h2 class="setting-title">Start over</h2><p class="setting-copy">Restore the original preview workspace. This replaces all current local data.</p><button class="btn btn-danger" style="margin-top:14px" data-action="reset-workspace">${icon('refresh')} Reset workspace</button></div></aside></div></main>`;
  }

  // ---------- Modal factories ----------
  function openModal(content) { modalRoot.innerHTML = `<div class="modal-overlay" data-action="close-modal-overlay">${content}</div>`; }
  function closeModal() { modalRoot.innerHTML = ''; }
  function modalHeader(title, subtitle = '') { return `<div class="modal-header"><div><h2>${e(title)}</h2>${subtitle ? `<p>${e(subtitle)}</p>` : ''}</div><button class="close-modal" type="button" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>`; }
  function field(label, name, value = '', type = 'text', opts = {}) {
    const klass = `field ${opts.span ? 'span-2' : ''}`;
    const optional = opts.required ? '' : '<span class="optional">optional</span>';
    const base = `<label for="field_${name}">${e(label)} ${optional}</label>`;
    let control;
    if (type === 'select') control = `<select id="field_${name}" name="${name}" ${opts.required ? 'required' : ''}>${opts.options || ''}</select>`;
    else if (type === 'textarea') control = `<textarea id="field_${name}" name="${name}" placeholder="${attr(opts.placeholder || '')}">${e(value || '')}</textarea>`;
    else control = `<input id="field_${name}" type="${type}" name="${name}" value="${attr(value || '')}" placeholder="${attr(opts.placeholder || '')}" ${opts.required ? 'required' : ''} ${opts.min !== undefined ? `min="${opts.min}"` : ''}/>`;
    return `<div class="${klass}" data-field-container="${name}">${base}${control}${opts.helper ? `<div class="helper-text">${e(opts.helper)}</div>` : ''}</div>`;
  }
  function showApplicationModal(appId = null) {
    const existing = appId ? getApplication(appId) : null;
    const app = existing || { company_name: '', job_title: '', job_type: 'Full-time', work_mode: 'Hybrid', location: '', source: 'LinkedIn', job_url: '', applied_date: localDate(), salary_min: '', salary_max: '', recruiter_name: '', recruiter_contact: '', status: 'Applied', priority: 'Medium', deadline: '', next_followup: '', notes: '', job_description: '', requirements: '', interview_details: '', resume_used: '', cover_letter_used: '' };
    const comp = existing ? getCompany(existing.company_id) : null;
    openModal(`<form class="modal" data-form="application" novalidate>${modalHeader(existing ? 'Edit application' : 'Add application', existing ? 'Update the record and keep your pipeline accurate.' : 'Capture an opportunity in under a minute.')}<div class="modal-body"><input type="hidden" name="id" value="${attr(existing?.id || '')}"><div class="form-section-title first">Role</div><div class="form-grid">${field('Company name', 'company_name', comp?.name || app.company_name, 'text', { required: true, placeholder: 'e.g. Acme Studio' })}${field('Job title', 'job_title', app.job_title, 'text', { required: true, placeholder: 'e.g. Product Designer' })}${field('Job type', 'job_type', app.job_type, 'select', { options: selectOptions(JOB_TYPES, app.job_type, 'Select job type') })}${field('Work location', 'work_mode', app.work_mode, 'select', { options: selectOptions(WORK_MODES, app.work_mode, 'Select work mode') })}${field('City', 'location', app.location, 'text', { placeholder: 'e.g. Jakarta' })}${field('Source', 'source', app.source, 'select', { options: selectOptions(SOURCES, app.source, 'Select source') })}${field('Job URL', 'job_url', app.job_url, 'url', { span: true, placeholder: 'https://…' })}</div><div class="form-section-title">Application</div><div class="form-grid">${field('Applied date', 'applied_date', app.applied_date, 'date')}${field('Current status', 'status', app.status, 'select', { options: selectOptions(STATUS_OPTIONS, app.status, 'Select status') })}${field('Salary min (monthly)', 'salary_min', app.salary_min, 'number', { min: 0, placeholder: 'e.g. 8000000' })}${field('Salary max (monthly)', 'salary_max', app.salary_max, 'number', { min: 0, placeholder: 'e.g. 12000000' })}${field('Priority', 'priority', app.priority, 'select', { options: selectOptions(PRIORITIES, app.priority, 'Select priority') })}${field('Deadline', 'deadline', app.deadline, 'date')}${field('Contact / recruiter', 'recruiter_name', app.recruiter_name, 'text', { placeholder: 'Name' })}${field('Recruiter contact', 'recruiter_contact', app.recruiter_contact, 'text', { placeholder: 'Email, phone, or social handle' })}${field('Next follow-up date', 'next_followup', app.next_followup, 'date')}${field('Interview details', 'interview_details', app.interview_details, 'text', { placeholder: 'Date, time, link, or agenda' })}${field('Notes', 'notes', app.notes, 'textarea', { span: true, placeholder: 'Context, talking points, and anything to remember' })}</div><div class="form-section-title">Job details & materials</div><div class="form-grid">${field('Job description', 'job_description', app.job_description, 'textarea', { span: true, placeholder: 'A concise description of the role' })}${field('Requirements', 'requirements', app.requirements, 'textarea', { span: true, placeholder: 'Skills, experience, and qualifications' })}${field('Resume used', 'resume_used', app.resume_used, 'text', { placeholder: 'e.g. CV — Frontend.pdf' })}${field('Cover letter used', 'cover_letter_used', app.cover_letter_used, 'text', { placeholder: 'e.g. Acme cover letter.pdf' })}</div><label class="checkbox-row"><input type="checkbox" name="set_reminder" ${checked(!existing && !!app.next_followup)}> Set reminder</label><div class="form-grid" style="margin-top:10px">${field('Reminder date', 'reminder_date', app.next_followup || '', 'date', { helper: 'Only created when “Set reminder” is checked.' })}${field('Reminder type', 'reminder_type', 'Follow-up', 'select', { options: selectOptions(['Follow-up', 'Interview', 'Technical Test', 'Deadline', 'Other'], 'Follow-up', 'Select type') })}</div></div><div class="modal-footer"><button class="btn" type="button" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${icon('check')} ${existing ? 'Save changes' : 'Add application'}</button></div></form>`);
  }
  function showAdvancedFilterModal() {
    const f = state.filters;
    openModal(`<form class="modal modal-small" data-form="advanced-filter">${modalHeader('More filters', 'Narrow the applications table or board.')}<div class="modal-body"><div class="form-grid">${field('Job type', 'jobType', f.jobType, 'select', { options: selectOptions(JOB_TYPES, f.jobType, 'All job types') })}${field('Work location', 'workMode', f.workMode, 'select', { options: selectOptions(WORK_MODES, f.workMode, 'All work modes') })}${field('Company', 'company', f.company, 'select', { options: `<option value="">All companies</option>${state.db.companies.sort((a,b)=>a.name.localeCompare(b.name)).map(c => `<option value="${c.id}" ${selected(f.company,c.id)}>${e(c.name)}</option>`).join('')}` })}${field('Applied on or after', 'after', f.after, 'date')}${field('Min salary', 'minSalary', f.minSalary, 'number', { min: 0, placeholder: '0' })}${field('Max salary', 'maxSalary', f.maxSalary, 'number', { min: 0, placeholder: 'No max' })}${field('Applied on or before', 'before', f.before, 'date')}</div></div><div class="modal-footer"><button class="btn" type="button" data-action="clear-filters">Clear all</button><button class="btn btn-primary" type="submit">Apply filters</button></div></form>`);
  }
  function showEventModal(appId = null) {
    const candidates = state.db.applications.filter(a => !TERMINAL.has(a.status));
    if (!candidates.length) { toast('Add an application first', 'Timeline events need an application.'); return; }
    const defaultId = appId || candidates[0].id;
    openModal(`<form class="modal modal-small" data-form="event" novalidate>${modalHeader('Add timeline event', 'Log a real interaction, milestone, or scheduled event.')}<div class="modal-body"><div class="form-grid">${field('Application', 'application_id', defaultId, 'select', { required: true, span: true, options: candidates.map(a => `<option value="${a.id}" ${selected(defaultId,a.id)}>${e(appCompanyName(a))} — ${e(a.job_title)}</option>`).join('') })}${field('Event type', 'event_type', 'Interview', 'select', { required: true, options: selectOptions(['Applied', 'Recruiter Viewed', 'Screening', 'Interview', 'Technical Test', 'Final Interview', 'Offer', 'Rejected', 'Other'], 'Interview', 'Select event type') })}${field('Event date', 'event_date', localDate(), 'date', { required: true })}${field('Title', 'title', '', 'text', { required: true, span: true, placeholder: 'e.g. Portfolio interview scheduled' })}${field('Description', 'description', '', 'textarea', { span: true, placeholder: 'Optional details, time, link, or outcome' })}</div></div><div class="modal-footer"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${icon('plus')} Add event</button></div></form>`);
  }
  function showReminderModal(appId) {
    const app = getApplication(appId); if (!app) return;
    openModal(`<form class="modal modal-small" data-form="reminder">${modalHeader('Set a reminder', `${appCompanyName(app)} · ${app.job_title}`)}<div class="modal-body"><input type="hidden" name="application_id" value="${app.id}"><div class="form-grid">${field('Reminder type', 'reminder_type', 'Follow-up', 'select', { required: true, options: selectOptions(['Follow-up', 'Interview', 'Technical Test', 'Deadline', 'Other'], 'Follow-up', 'Select type') })}${field('Reminder date', 'reminder_date', app.next_followup || localDate(), 'date', { required: true })}</div></div><div class="modal-footer"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${icon('bell')} Create reminder</button></div></form>`);
  }
  function showAttachmentModal(appId) {
    const app = getApplication(appId); if (!app) return;
    openModal(`<form class="modal modal-small" data-form="attachment">${modalHeader('Add attachment', `${appCompanyName(app)} · ${app.job_title}`)}<div class="modal-body"><input type="hidden" name="application_id" value="${app.id}">${field('File or resource name', 'attachment_name', '', 'text', { required: true, placeholder: 'e.g. Portfolio case study.pdf' })}<p class="helper-text" style="margin-top:9px">This keeps a reference in your local tracker. Store the file itself wherever you prefer.</p></div><div class="modal-footer"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${icon('plus')} Add attachment</button></div></form>`);
  }
  function showSavedJobModal(jobId = null) {
    const existing = jobId ? state.db.saved_jobs.find(x => x.id === jobId) : null;
    const company = existing ? getCompany(existing.company_id) : null;
    const job = existing || { company_name: '', job_title: '', source: 'LinkedIn', url: '', salary_min: '', salary_max: '', deadline: '', priority: 'Medium', notes: '' };
    openModal(`<form class="modal modal-small" data-form="saved-job" novalidate>${modalHeader(existing ? 'Edit saved job' : 'Save a job', 'Keep interesting roles until you are ready to apply.')}<div class="modal-body"><input type="hidden" name="id" value="${attr(existing?.id || '')}"><div class="form-grid">${field('Company', 'company_name', company?.name || job.company_name, 'text', { required: true, span: true, placeholder: 'e.g. Studio North' })}${field('Position', 'job_title', job.job_title, 'text', { required: true, span: true, placeholder: 'e.g. Product Designer' })}${field('Source', 'source', job.source, 'select', { options: selectOptions(SOURCES, job.source, 'Select source') })}${field('Priority', 'priority', job.priority, 'select', { options: selectOptions(PRIORITIES, job.priority, 'Select priority') })}${field('URL', 'url', job.url, 'url', { span: true, placeholder: 'https://…' })}${field('Salary min', 'salary_min', job.salary_min || job.salary, 'number', { min: 0 })}${field('Salary max', 'salary_max', job.salary_max, 'number', { min: 0 })}${field('Deadline', 'deadline', job.deadline, 'date')}${field('Notes', 'notes', job.notes, 'textarea', { span: true, placeholder: 'Why this role is worth saving' })}</div></div><div class="modal-footer"><button class="btn" type="button" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${icon('bookmark')} ${existing ? 'Save changes' : 'Save job'}</button></div></form>`);
  }
  function showConfirm({ title, message, confirmLabel = 'Delete', action, id }) {
    openModal(`<div class="modal modal-small">${modalHeader(title)}<div class="modal-body"><p class="confirm-message">${e(message)}</p></div><div class="modal-footer"><button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-danger" data-action="${attr(action)}" data-id="${attr(id || '')}">${icon('trash')} ${e(confirmLabel)}</button></div></div>`);
  }
  function showDayEvents(date) {
    const events = getCalendarEvents().filter(x => x.date === date);
    openModal(`<div class="modal modal-small">${modalHeader(formatDate(date), `${events.length} scheduled item${events.length === 1 ? '' : 's'}`)}<div class="modal-body"><div class="resource-list">${events.map(ev => `<button class="resource-row" data-action="open-detail" data-id="${ev.appId}">${icon('calendar')}<span>${e(ev.title)} · ${e(appCompanyName(getApplication(ev.appId)))}</span>${icon('chevronRight')}</button>`).join('')}</div></div><div class="modal-footer"><button class="btn" data-action="close-modal">Close</button></div></div>`);
  }

  // ---------- Data mutation ----------
  function findOrCreateCompany(name) {
    const cleaned = String(name || '').trim();
    let company = state.db.companies.find(c => c.name.toLowerCase() === cleaned.toLowerCase());
    if (!company) { company = { id: uid('company'), name: cleaned, logo: '', website: '', industry: '', location: '', notes: '', created_at: nowIso() }; state.db.companies.push(company); }
    return company;
  }
  function value(form, key) { return String(new FormData(form).get(key) ?? '').trim(); }
  function numberValue(form, key) { const n = Number(value(form, key)); return Number.isFinite(n) && n > 0 ? n : 0; }
  function setError(form, name, message) { const holder = form.querySelector(`[data-field-container="${name}"]`); if (holder) { holder.classList.add('has-error'); let error = holder.querySelector('.field-error'); if (!error) { error = document.createElement('div'); error.className = 'field-error'; holder.append(error); } error.textContent = message; } }
  function clearErrors(form) { form.querySelectorAll('.has-error').forEach(x => x.classList.remove('has-error')); form.querySelectorAll('.field-error').forEach(x => x.remove()); }
  function updateApplicationFromForm(form) {
    clearErrors(form);
    const companyName = value(form, 'company_name'); const jobTitle = value(form, 'job_title');
    let valid = true;
    if (!companyName) { setError(form, 'company_name', 'Company name is required.'); valid = false; }
    if (!jobTitle) { setError(form, 'job_title', 'Job title is required.'); valid = false; }
    if (!valid) return;
    const existingId = value(form, 'id'); const existing = existingId ? getApplication(existingId) : null;
    const company = findOrCreateCompany(companyName);
    const record = existing || { id: uid('app'), created_at: nowIso(), attachments: [] };
    const priorStatus = record.status;
    Object.assign(record, {
      company_id: company.id, job_title: jobTitle, job_type: value(form, 'job_type'), location: value(form, 'location'), work_mode: value(form, 'work_mode'), source: value(form, 'source') || 'Other', job_url: value(form, 'job_url'), applied_date: value(form, 'applied_date'), salary_min: numberValue(form, 'salary_min'), salary_max: numberValue(form, 'salary_max'), recruiter_name: value(form, 'recruiter_name'), recruiter_contact: value(form, 'recruiter_contact'), status: value(form, 'status') || 'Saved', priority: value(form, 'priority') || 'Medium', deadline: value(form, 'deadline'), next_followup: value(form, 'next_followup'), notes: value(form, 'notes'), job_description: value(form, 'job_description'), requirements: value(form, 'requirements'), interview_details: value(form, 'interview_details'), resume_used: value(form, 'resume_used'), cover_letter_used: value(form, 'cover_letter_used'), updated_at: nowIso()
    });
    if (!existing) {
      state.db.applications.push(record);
      state.db.application_events.push({ id: uid('event'), application_id: record.id, event_type: record.status === 'Saved' ? 'Saved' : 'Applied', event_date: record.applied_date || localDate(), title: record.status === 'Saved' ? 'Job saved' : 'Application submitted', description: `Added in JobTrack${record.source ? ` · ${record.source}` : ''}.` });
    } else if (priorStatus !== record.status) {
      state.db.application_events.push({ id: uid('event'), application_id: record.id, event_type: record.status, event_date: localDate(), title: `Status changed to ${record.status}`, description: '' });
    }
    if (new FormData(form).get('set_reminder') === 'on') {
      const reminderDate = value(form, 'reminder_date');
      if (reminderDate) {
        const reminderType = value(form, 'reminder_type') || 'Follow-up';
        const duplicate = state.db.reminders.some(r => r.application_id === record.id && !r.completed && r.reminder_date === reminderDate && r.reminder_type === reminderType);
        if (!duplicate) state.db.reminders.push({ id: uid('reminder'), application_id: record.id, reminder_type: reminderType, reminder_date: reminderDate, completed: false });
      }
    }
    saveDb(); closeModal();
    toast(existing ? 'Application updated' : 'Application added', existing ? 'Your dashboard and metrics are current.' : 'The application is now in your pipeline.');
    if (state.view === 'detail') state.detailAppId = record.id;
    renderApp();
  }
  function createEventFromForm(form) {
    clearErrors(form);
    const appId = value(form, 'application_id'); const title = value(form, 'title'); const date = value(form, 'event_date');
    let valid = true; if (!title) { setError(form, 'title', 'A timeline title is required.'); valid = false; } if (!date) { setError(form, 'event_date', 'An event date is required.'); valid = false; }
    if (!valid) return;
    const application = getApplication(appId); if (!application) return;
    const type = value(form, 'event_type') || 'Note';
    state.db.application_events.push({ id: uid('event'), application_id: appId, event_type: type, event_date: date, title, description: value(form, 'description') });
    application.updated_at = nowIso();
    const statusByEvent = { Screening: 'Screening', Interview: 'Interview', 'Technical Test': 'Technical Test', 'Final Interview': 'Final Interview', Offer: 'Offer', Rejected: 'Rejected' };
    if (statusByEvent[type] && application.status !== statusByEvent[type]) application.status = statusByEvent[type];
    saveDb(); closeModal(); toast('Timeline event added', 'The activity appears in your application timeline and calendar.'); renderApp();
  }
  function createReminderFromForm(form) {
    const appId = value(form, 'application_id'), date = value(form, 'reminder_date'), type = value(form, 'reminder_type');
    if (!date) { setError(form, 'reminder_date', 'Choose a reminder date.'); return; }
    state.db.reminders.push({ id: uid('reminder'), application_id: appId, reminder_type: type || 'Follow-up', reminder_date: date, completed: false });
    const app = getApplication(appId); if (app) app.updated_at = nowIso();
    saveDb(); closeModal(); toast('Reminder created', `${type || 'Reminder'} is set for ${formatDate(date)}.`); renderApp();
  }
  function addAttachmentFromForm(form) {
    const appId = value(form, 'application_id'), name = value(form, 'attachment_name');
    if (!name) { setError(form, 'attachment_name', 'Enter a file or resource name.'); return; }
    const app = getApplication(appId); if (!app) return;
    app.attachments = app.attachments || []; app.attachments.push({ name, created_at: nowIso() }); app.updated_at = nowIso();
    saveDb(); closeModal(); toast('Attachment added', 'A reference was added to this application.'); renderApp();
  }
  function saveSavedJobFromForm(form) {
    clearErrors(form);
    const companyName = value(form, 'company_name'); const title = value(form, 'job_title'); let valid = true;
    if (!companyName) { setError(form, 'company_name', 'Company name is required.'); valid = false; } if (!title) { setError(form, 'job_title', 'Position is required.'); valid = false; } if (!valid) return;
    const existingId = value(form, 'id'); const existing = existingId ? state.db.saved_jobs.find(x => x.id === existingId) : null;
    const company = findOrCreateCompany(companyName);
    const record = existing || { id: uid('saved'), created_at: nowIso(), status: 'Saved' };
    Object.assign(record, { company_id: company.id, job_title: title, source: value(form, 'source') || 'Other', url: value(form, 'url'), salary_min: numberValue(form, 'salary_min'), salary_max: numberValue(form, 'salary_max'), deadline: value(form, 'deadline'), priority: value(form, 'priority') || 'Medium', notes: value(form, 'notes'), updated_at: nowIso() });
    if (!existing) state.db.saved_jobs.push(record);
    saveDb(); closeModal(); toast(existing ? 'Saved job updated' : 'Job saved', existing ? 'Your shortlist is up to date.' : 'Review it whenever you are ready to apply.'); renderApp();
  }

  // ---------- Events ----------
  function navigate(view) {
    state.view = view; state.detailAppId = null; state.sidebarOpen = false; state.globalOpen = false; state.notificationOpen = false; state.profileOpen = false; state.quickFilterOpen = false;
    renderApp(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function openDetail(id) {
    if (!getApplication(id)) return;
    closeModal(); state.view = 'detail'; state.detailAppId = id; state.globalOpen = false; state.notificationOpen = false; state.profileOpen = false; renderApp(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function deleteApplication(id) {
    const app = getApplication(id); if (!app) return;
    state.db.applications = state.db.applications.filter(a => a.id !== id);
    state.db.application_events = state.db.application_events.filter(x => x.application_id !== id);
    state.db.reminders = state.db.reminders.filter(x => x.application_id !== id);
    state.db.saved_jobs.forEach(x => { if (x.application_id === id) { x.status = 'Saved'; x.application_id = ''; } });
    // Keep company notes/history only when another record uses it; otherwise remove empty automatic company.
    const company = getCompany(app.company_id);
    if (company && !state.db.applications.some(a => a.company_id === company.id) && !state.db.saved_jobs.some(s => s.company_id === company.id) && !company.notes && !company.website) state.db.companies = state.db.companies.filter(c => c.id !== company.id);
    saveDb(); closeModal(); state.view = 'applications'; state.detailAppId = null; toast('Application deleted', 'Related timeline events and reminders were removed.'); renderApp();
  }
  function deleteSavedJob(id) {
    state.db.saved_jobs = state.db.saved_jobs.filter(x => x.id !== id); saveDb(); closeModal(); toast('Saved job deleted', 'The job was removed from your shortlist.'); renderApp();
  }
  function convertSavedJob(id) {
    const job = state.db.saved_jobs.find(x => x.id === id); if (!job || job.status === 'Applied') return;
    const app = { id: uid('app'), company_id: job.company_id, job_title: job.job_title, job_type: '', location: '', work_mode: '', source: job.source, job_url: job.url || '', applied_date: localDate(), salary_min: Number(job.salary_min || job.salary || 0), salary_max: Number(job.salary_max || 0), recruiter_name: '', recruiter_contact: '', status: 'Applied', priority: job.priority || 'Medium', deadline: job.deadline || '', next_followup: '', notes: job.notes || '', job_description: '', requirements: '', interview_details: '', resume_used: '', cover_letter_used: '', attachments: [], created_at: nowIso(), updated_at: nowIso() };
    state.db.applications.push(app); state.db.application_events.push({ id: uid('event'), application_id: app.id, event_type: 'Applied', event_date: app.applied_date, title: 'Application submitted', description: `Converted from saved job${app.source ? ` · ${app.source}` : ''}.` });
    job.status = 'Applied'; job.application_id = app.id; job.updated_at = nowIso(); saveDb(); toast('Saved job converted', 'It is now an application in your pipeline.'); renderApp();
  }
  function clearDemoData() {
    const seedAppIds = new Set(state.db.applications.filter(x => x.is_seed).map(x => x.id));
    const count = seedAppIds.size + state.db.saved_jobs.filter(x => x.is_seed).length;
    state.db.applications = state.db.applications.filter(x => !x.is_seed);
    state.db.saved_jobs = state.db.saved_jobs.filter(x => !x.is_seed);
    state.db.application_events = state.db.application_events.filter(x => !x.is_seed && !seedAppIds.has(x.application_id));
    state.db.reminders = state.db.reminders.filter(x => !x.is_seed && !seedAppIds.has(x.application_id));
    state.db.companies = state.db.companies.filter(c => !c.is_seed || state.db.applications.some(a => a.company_id === c.id) || state.db.saved_jobs.some(j => j.company_id === c.id));
    saveDb(); closeModal(); toast('Demo data removed', `${count} starter record${count === 1 ? '' : 's'} removed. Your own records remain.`); renderApp();
  }
  function exportData() {
    const clean = JSON.stringify(state.db, null, 2);
    const blob = new Blob([clean], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `jobtrack-backup-${localDate()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('Workspace exported', 'A JSON backup was downloaded.');
  }
  function resetWorkspace() { state.db = createSeedDatabase(); state.filters = defaultFilters(); state.view = 'dashboard'; saveDb(); closeModal(); toast('Workspace reset', 'The preview workspace has been restored.'); renderApp(); }
  function toggleTheme() { state.db.meta.theme = state.db.meta.theme === 'dark' ? 'light' : 'dark'; saveDb(); state.profileOpen = false; renderApp(); }

  function handleAppClick(event) {
    const actionEl = event.target.closest('[data-action]');
    // Clicking outside temporary topbar popovers closes them.
    if (!actionEl) {
      // Do not redraw while a user is interacting with an input/select. Only redraw
      // when there is an open transient surface that genuinely needs closing.
      let changed = false;
      if (!event.target.closest('.global-search') && state.globalOpen) { state.globalOpen = false; changed = true; }
      if (!event.target.closest('.popover') && !event.target.closest('.top-actions') && (state.notificationOpen || state.profileOpen || state.quickFilterOpen)) {
        state.notificationOpen = false; state.profileOpen = false; state.quickFilterOpen = false; changed = true;
      }
      if (changed) renderApp();
      return;
    }
    const action = actionEl.dataset.action; const id = actionEl.dataset.id;
    if (action === 'navigate') navigate(actionEl.dataset.view);
    else if (action === 'toggle-sidebar') { state.sidebarOpen = !state.sidebarOpen; renderApp(); }
    else if (action === 'open-application-modal') showApplicationModal(id || null);
    else if (action === 'open-saved-job-modal') showSavedJobModal(id || null);
    else if (action === 'edit-saved-job') showSavedJobModal(id);
    else if (action === 'open-event-modal') showEventModal(id || null);
    else if (action === 'open-reminder-modal') showReminderModal(id);
    else if (action === 'open-attachment-modal') showAttachmentModal(id);
    else if (action === 'open-detail') openDetail(id);
    else if (action === 'back-applications') navigate('applications');
    else if (action === 'set-app-view') { state.appViewMode = actionEl.dataset.mode; renderApp(); }
    else if (action === 'filter-status') { state.filters.status = actionEl.dataset.status; state.view = 'applications'; state.appViewMode = 'table'; renderApp(); }
    else if (action === 'clear-filters') { state.filters = defaultFilters(); state.quickFilterOpen = false; closeModal(); renderApp(); }
    else if (action === 'open-advanced-filter') showAdvancedFilterModal();
    else if (action === 'toggle-quick-filter') { state.quickFilterOpen = !state.quickFilterOpen; state.notificationOpen = false; state.profileOpen = false; renderApp(); }
    else if (action === 'toggle-notifications') { state.notificationOpen = !state.notificationOpen; state.quickFilterOpen = false; state.profileOpen = false; renderApp(); }
    else if (action === 'toggle-profile') { state.profileOpen = !state.profileOpen; state.notificationOpen = false; state.quickFilterOpen = false; renderApp(); }
    else if (action === 'toggle-theme') toggleTheme();
    else if (action === 'calendar-previous') { state.calendarDate = addMonths(state.calendarDate, -1); renderApp(); }
    else if (action === 'calendar-next') { state.calendarDate = addMonths(state.calendarDate, 1); renderApp(); }
    else if (action === 'calendar-today') { state.calendarDate = startOfMonth(new Date()); renderApp(); }
    else if (action === 'open-day-events') showDayEvents(actionEl.dataset.date);
    else if (action === 'open-company') { state.filters = { ...defaultFilters(), company: id }; state.view = 'applications'; renderApp(); }
    else if (action === 'delete-application') { const a = getApplication(id); if (a) showConfirm({ title: 'Delete application?', message: `“${a.job_title}” at ${appCompanyName(a)} and its related events and reminders will be permanently removed.`, action: 'confirm-delete-application', id }); }
    else if (action === 'confirm-delete-application') deleteApplication(id);
    else if (action === 'delete-saved-job') { const j = state.db.saved_jobs.find(x => x.id === id); if (j) showConfirm({ title: 'Delete saved job?', message: `“${j.job_title}” will be removed from your shortlist.`, action: 'confirm-delete-saved-job', id }); }
    else if (action === 'confirm-delete-saved-job') deleteSavedJob(id);
    else if (action === 'convert-saved-job') convertSavedJob(id);
    else if (action === 'complete-reminder') { const r = state.db.reminders.find(x => x.id === id); if (r) { r.completed = true; saveDb(); toast('Reminder completed', 'It will no longer appear in your action list.'); renderApp(); } }
    else if (action === 'remove-attachment') { const app = getApplication(id); if (app) { app.attachments.splice(Number(actionEl.dataset.index), 1); app.updated_at = nowIso(); saveDb(); toast('Attachment removed'); renderApp(); } }
    else if (action === 'clear-demo') { if (hasSeedData()) showConfirm({ title: 'Remove demo data?', message: 'Only clearly marked sample applications and their demo events/reminders will be removed. Anything you added stays intact.', confirmLabel: 'Remove demo', action: 'confirm-clear-demo', id: 'yes' }); }
    else if (action === 'confirm-clear-demo') clearDemoData();
    else if (action === 'reset-workspace') showConfirm({ title: 'Reset workspace?', message: 'This replaces all local JobTrack data with the original preview workspace. This cannot be undone.', confirmLabel: 'Reset workspace', action: 'confirm-reset-workspace', id: 'yes' });
    else if (action === 'confirm-reset-workspace') resetWorkspace();
    else if (action === 'export-data') exportData();
  }
  function handleModalClick(event) {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'close-modal' || (action === 'close-modal-overlay' && event.target === actionEl)) closeModal();
    else if (action === 'open-detail') openDetail(actionEl.dataset.id);
    else if (action === 'clear-filters') { state.filters = defaultFilters(); closeModal(); renderApp(); }
    else if (action === 'confirm-delete-application') deleteApplication(actionEl.dataset.id);
    else if (action === 'confirm-delete-saved-job') deleteSavedJob(actionEl.dataset.id);
    else if (action === 'confirm-clear-demo') clearDemoData();
    else if (action === 'confirm-reset-workspace') resetWorkspace();
  }
  function handleAppInput(event) {
    const target = event.target;
    if (target.matches('[data-global-search]')) {
      state.globalQuery = target.value; state.globalOpen = true; renderApp();
    } else if (target.matches('[data-filter="search"]')) {
      state.filters.search = target.value; renderApp(); requestAnimationFrame(() => { const el = appRoot.querySelector('[data-filter="search"]'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } });
    }
  }
  function handleAppChange(event) {
    const target = event.target;
    if (target.dataset.filter && target.dataset.filter !== 'search') { state.filters[target.dataset.filter] = target.value; renderApp(); }
  }
  function handleModalSubmit(event) {
    event.preventDefault(); const form = event.target; const kind = form.dataset.form;
    if (kind === 'application') updateApplicationFromForm(form);
    else if (kind === 'event') createEventFromForm(form);
    else if (kind === 'reminder') createReminderFromForm(form);
    else if (kind === 'attachment') addAttachmentFromForm(form);
    else if (kind === 'saved-job') saveSavedJobFromForm(form);
    else if (kind === 'advanced-filter') { ['jobType','workMode','company','minSalary','maxSalary','after','before'].forEach(k => { state.filters[k] = value(form, k); }); closeModal(); renderApp(); }
  }
  function handleDragStart(event) {
    const card = event.target.closest('.kanban-card'); if (!card) return;
    event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', card.dataset.appId); card.classList.add('dragging');
  }
  function handleDragEnd(event) { const card = event.target.closest('.kanban-card'); if (card) card.classList.remove('dragging'); appRoot.querySelectorAll('.kanban-column').forEach(x => x.classList.remove('drop-target')); }
  function handleDragOver(event) { const column = event.target.closest('.kanban-column'); if (!column) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; column.classList.add('drop-target'); }
  function handleDragLeave(event) { const column = event.target.closest('.kanban-column'); if (column && !column.contains(event.relatedTarget)) column.classList.remove('drop-target'); }
  function handleDrop(event) {
    const column = event.target.closest('.kanban-column'); if (!column) return; event.preventDefault(); const app = getApplication(event.dataTransfer.getData('text/plain')); const status = column.dataset.kanbanStatus;
    if (app && status && app.status !== status) { app.status = status; app.updated_at = nowIso(); state.db.application_events.push({ id: uid('event'), application_id: app.id, event_type: status, event_date: localDate(), title: `Status changed to ${status}`, description: 'Moved in Kanban board.' }); saveDb(); toast('Status updated', `${app.job_title} moved to ${status}.`); }
    renderApp();
  }
  function toast(title, message = '') {
    const id = uid('toast'); const item = document.createElement('div'); item.className = 'toast'; item.id = id; item.innerHTML = `${icon('check')}<div><b>${e(title)}</b>${message ? `<span>${e(message)}</span>` : ''}</div>`; toastRoot.append(item); setTimeout(() => { const n = document.getElementById(id); if (n) { n.style.opacity = '0'; n.style.transform = 'translateY(5px)'; n.style.transition = 'opacity .18s, transform .18s'; setTimeout(() => n.remove(), 220); } }, 3400);
  }

  // ---------- Boot ----------
  state.db = loadDb();
  appRoot.addEventListener('click', handleAppClick);
  appRoot.addEventListener('input', handleAppInput);
  appRoot.addEventListener('change', handleAppChange);
  appRoot.addEventListener('dragstart', handleDragStart);
  appRoot.addEventListener('dragend', handleDragEnd);
  appRoot.addEventListener('dragover', handleDragOver);
  appRoot.addEventListener('dragleave', handleDragLeave);
  appRoot.addEventListener('drop', handleDrop);
  modalRoot.addEventListener('click', handleModalClick);
  modalRoot.addEventListener('submit', handleModalSubmit);
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); state.globalOpen = true; renderApp(); requestAnimationFrame(() => appRoot.querySelector('[data-global-search]')?.focus()); }
    if (event.key === 'Escape') { if (modalRoot.innerHTML) closeModal(); else { state.globalOpen = false; state.notificationOpen = false; state.profileOpen = false; state.quickFilterOpen = false; renderApp(); } }
  });
  renderApp();
  window.setTimeout(() => { state.loading = false; renderApp(); }, 220);
})();
