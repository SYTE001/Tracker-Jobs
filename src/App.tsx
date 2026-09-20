import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { KanbanBoard } from './features/kanban/KanbanBoard'
import { useEffect } from 'react'
import { useJobStore } from './store/useJobStore'

export default function App() {
  const markGhosted = useJobStore(state => state.markGhosted)

  useEffect(() => {
    // Run the smart ghosted check on mount
    markGhosted()
  }, [markGhosted])

  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/board" replace />} />
          <Route path="/board" element={<KanbanBoard />} />
          {/* List and Dashboard views to be added later */}
          <Route path="*" element={<Navigate to="/board" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
