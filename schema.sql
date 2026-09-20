-- JobTrack relational schema reference
-- The preview uses the same table-shaped collections in browser local storage,
-- so it can run without a server. This schema can be used directly with SQLite/Postgres.

CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  website TEXT,
  industry TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  job_type TEXT,
  location TEXT,
  work_mode TEXT,
  source TEXT,
  job_url TEXT,
  applied_date DATE,
  salary_min NUMERIC,
  salary_max NUMERIC,
  recruiter_name TEXT,
  recruiter_contact TEXT,
  status TEXT NOT NULL DEFAULT 'Saved',
  priority TEXT NOT NULL DEFAULT 'Medium',
  deadline DATE,
  next_followup DATE,
  notes TEXT,
  job_description TEXT,
  requirements TEXT,
  interview_details TEXT,
  resume_used TEXT,
  cover_letter_used TEXT,
  attachments_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX applications_company_idx ON applications(company_id);
CREATE INDEX applications_status_idx ON applications(status);
CREATE INDEX applications_applied_date_idx ON applications(applied_date);

CREATE TABLE application_events (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX application_events_application_date_idx
  ON application_events(application_id, event_date DESC);

CREATE TABLE saved_jobs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  source TEXT,
  url TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  deadline DATE,
  priority TEXT NOT NULL DEFAULT 'Medium',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Saved',
  application_id TEXT REFERENCES applications(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  reminder_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX reminders_due_idx ON reminders(completed, reminder_date);
