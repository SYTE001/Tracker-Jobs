import { Droppable } from '@hello-pangea/dnd'
import { KanbanCard } from './KanbanCard'
import type { Application } from '@/types'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  applications: Application[]
}

export function KanbanColumn({ id, title, color, applications }: KanbanColumnProps) {
  return (
    <div className="w-[320px] flex-shrink-0 flex flex-col h-full max-h-full rounded-lg bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
      <div className="p-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {applications.length}
        </span>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors ${
              snapshot.isDraggingOver ? 'bg-slate-200/30 dark:bg-slate-800/30' : ''
            }`}
          >
            {applications.map((app, index) => (
              <KanbanCard key={app.id} application={app} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
