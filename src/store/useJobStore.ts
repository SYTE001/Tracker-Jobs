import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { JobTrackDbSchema } from '@/types'
import type { JobTrackDb, Application, Company, ApplicationEvent, JobStatus } from '@/types'

const STORAGE_KEY = 'jobtrack-local-db-v1'

interface JobState extends JobTrackDb {
  // Actions
  addApplication: (app: Application) => void
  updateApplication: (id: string, updates: Partial<Application>) => void
  addCompany: (company: Company) => void
  addEvent: (event: ApplicationEvent) => void
  // Ghosted check
  markGhosted: () => void
}

// Custom storage to handle the legacy vanilla JS data format
// Legacy format was directly: { meta: {...}, applications: [...] }
// Zustand expects: { state: { meta: {...}, applications: [...] }, version: 0 }
const legacyStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = localStorage.getItem(name)
    if (!value) return null
    try {
      const parsed = JSON.parse(value)
      if (parsed.state) return value // Already Zustand format
      
      // Parse with zod to ensure valid data, dropping invalid fields
      const legacyData = JobTrackDbSchema.parse(parsed)
      
      // Wrap in Zustand format
      return JSON.stringify({ state: legacyData, version: 0 })
    } catch (e) {
      console.error('Failed to parse legacy data', e)
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(name, value)
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name)
  },
}

const defaultState: JobTrackDb = {
  meta: { version: 1, theme: 'light' },
  applications: [],
  companies: [],
  application_events: [],
  reminders: [],
  saved_jobs: [],
  attachments: []
}

export const useJobStore = create<JobState>()(
  persist(
    (set) => ({
      ...defaultState,
      
      addApplication: (app) => set((state) => ({
        applications: [...state.applications, app]
      })),
      
      updateApplication: (id, updates) => set((state) => ({
        applications: state.applications.map(app => 
          app.id === id ? { ...app, ...updates, updated_at: new Date().toISOString() } : app
        )
      })),
      
      addCompany: (company) => set((state) => ({
        companies: [...state.companies, company]
      })),
      
      addEvent: (event) => set((state) => ({
        application_events: [...state.application_events, event]
      })),
      
      markGhosted: () => set((state) => {
        const now = new Date()
        let changed = false
        const updated = state.applications.map(app => {
          if (app.status === 'applied' || app.status === 'interviewing') {
            const lastUpdated = new Date(app.updated_at || app.applied_date || now)
            const diffDays = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 3600 * 24))
            
            if (diffDays >= 21) {
              changed = true
              return { ...app, status: 'ghosted' as JobStatus, updated_at: now.toISOString() }
            }
          }
          return app
        })
        return changed ? { applications: updated } : state
      })
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => legacyStorage)
    }
  )
)
