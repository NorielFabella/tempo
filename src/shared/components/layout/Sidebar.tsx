import {
  Home,
  MessageSquareMore,
  Settings,
  UserCircle,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/app', label: 'Home', icon: Home },
  { to: '/app/chat', label: 'Chat', icon: MessageSquareMore },
  { to: '/app/profile', label: 'Profile', icon: UserCircle },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

type SidebarProps = {
  isMobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 lg:flex">
        <div className="border-b border-slate-800 px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Tempo
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Chat
          </p>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-1 p-4"
        >
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-200 ease-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
        aria-hidden={!isMobileOpen}
      >
        <div className="flex items-start justify-between border-b border-slate-800 px-5 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Tempo
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Chat
            </p>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="flex-1 space-y-1 p-4"
        >
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app'}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
