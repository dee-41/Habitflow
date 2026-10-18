import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import MobileNav from './MobileNav.jsx'
import { useReminderNotifications } from '../../hooks/useReminderNotifications.js'

export default function AppLayout() {
  useReminderNotifications()

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      <Sidebar />

      <main id="main" className="pb-24 md:pb-10 md:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
          <Outlet />
        </div>
      </main>

      <MobileNav />
    </div>
  )
}