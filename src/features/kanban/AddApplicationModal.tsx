import { useState } from 'react'
import { useJobStore } from '@/store/useJobStore'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog'
import { Plus, Link, Building, MapPin } from 'lucide-react'

// Note: Radix UI primitives are unstyled. We provide our own Tailwind styling matching shadcn.
export function AddApplicationModal() {
  const [open, setOpen] = useState(false)
  const addApplication = useJobStore(state => state.addApplication)
  const addCompany = useJobStore(state => state.addCompany)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const companyName = formData.get('companyName') as string
    const companyId = `cmp_${Date.now()}`
    
    // Add Company
    addCompany({
      id: companyId,
      name: companyName,
      created_at: new Date().toISOString()
    })

    // Add Application
    addApplication({
      id: `app_${Date.now()}`,
      job_title: formData.get('jobTitle') as string,
      company_id: companyId,
      status: 'applied', // Default
      location: formData.get('location') as string,
      work_mode: formData.get('workMode') as string,
      job_type: formData.get('jobType') as string,
      url: formData.get('url') as string,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-9 px-4 flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline-block">Add Job</span>
        </button>
      </DialogTrigger>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
          <DialogContent className="fixed z-50 grid w-full max-w-lg gap-4 bg-white dark:bg-slate-950 p-6 shadow-xl shadow-slate-900/10 sm:rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in-90 zoom-in-95 duration-200">
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <DialogTitle className="text-lg font-semibold leading-none tracking-tight">Add Application</DialogTitle>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Job URL</label>
                  <div className="relative">
                    <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <input 
                      name="url" 
                      placeholder="https://linkedin.com/jobs/..." 
                      className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Job Title <span className="text-red-500">*</span></label>
                    <input 
                      name="jobTitle" 
                      required
                      placeholder="e.g. Senior Frontend Engineer" 
                      className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Company <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                      <input 
                        name="companyName" 
                        required
                        placeholder="e.g. Acme Corp" 
                        className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                      <input 
                        name="location" 
                        placeholder="e.g. New York, NY" 
                        className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Work Mode</label>
                    <select 
                      name="workMode" 
                      className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setOpen(false)}
                  className="h-9 px-4 py-2 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="h-9 px-4 py-2 inline-flex items-center justify-center rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Save Application
                </button>
              </div>
            </form>
          </DialogContent>
        </div>
      )}
    </Dialog>
  )
}
