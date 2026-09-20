import { Draggable } from '@hello-pangea/dnd'
import type { Application } from '@/types'
import { useJobStore } from '@/store/useJobStore'
import { MoreHorizontal, Building, MapPin, Calendar, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface KanbanCardProps {
  application: Application
  index: number
}

export function KanbanCard({ application, index }: KanbanCardProps) {
  const company = useJobStore(state => state.companies.find(c => c.id === application.company_id))
  
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  const logoUrl = company?.website 
    ? `https://logo.clearbit.com/${company.website.replace(/^https?:\/\//, '').split('/')[0]}`
    : null

  return (
    <Draggable draggableId={application.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group bg-white dark:bg-slate-950 p-4 rounded-xl border ${
            snapshot.isDragging 
              ? 'border-blue-500 shadow-xl shadow-blue-500/10 rotate-2' 
              : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
          } transition-all duration-200 cursor-grab active:cursor-grabbing`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex items-center justify-center text-slate-500 font-bold text-sm">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={company?.name || 'Company'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <span style={{ display: logoUrl ? 'none' : 'flex' }}>
                  {getInitials(company?.name || '??')}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {application.job_title}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>{company?.name || 'Unknown Company'}</span>
                </div>
              </div>
            </div>
            
            <button className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {(application.location || application.work_mode) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {application.location} 
                {application.location && application.work_mode ? ' • ' : ''}
                {application.work_mode && <span className="capitalize">{application.work_mode}</span>}
              </span>
            </div>
          )}

          {application.tags && application.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {application.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium tracking-wide uppercase">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {application.updated_at 
                  ? formatDistanceToNow(new Date(application.updated_at), { addSuffix: true })
                  : 'Just now'}
              </span>
            </div>
            
            {application.url && (
              <a 
                href={application.url} 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
