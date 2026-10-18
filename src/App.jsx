import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import StreaksPage from './pages/StreaksPage.jsx'
import TasksPage from './pages/TasksPage.jsx'
import RemindersPage from './pages/RemindersPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<CalendarPage />} />
        <Route path="streaks" element={<StreaksPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Old URL from the first version */}
        <Route path="habits" element={<Navigate to="/streaks" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}