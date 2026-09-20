import { DragDropContext } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { useJobStore } from '@/store/useJobStore'
import { KanbanColumn } from './KanbanColumn'
import { JobStatus } from '@/types'

const COLUMNS: { id: JobStatus; title: string; color: string }[] = [
  { id: 'wishlist', title: 'Wishlist', color: 'bg-slate-500' },
  { id: 'applied', title: 'Applied', color: 'bg-blue-500' },
  { id: 'interviewing', title: 'Interviewing', color: 'bg-violet-500' },
  { id: 'offer', title: 'Offer', color: 'bg-emerald-500' },
  { id: 'rejected', title: 'Rejected', color: 'bg-rose-500' },
  { id: 'ghosted', title: 'Ghosted', color: 'bg-amber-500' },
]

export function KanbanBoard() {
  const applications = useJobStore((state) => state.applications)
  const updateApplication = useJobStore((state) => state.updateApplication)

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    updateApplication(draggableId, { status: destination.droppableId as JobStatus })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Drag and drop applications to update their status.</p>
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full gap-4 pb-4 items-start min-w-max">
            {COLUMNS.map(col => {
              const columnApps = applications.filter(app => app.status === col.id)
              return (
                <KanbanColumn 
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  color={col.color}
                  applications={columnApps}
                />
              )
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}
