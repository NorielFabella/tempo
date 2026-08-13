import { Home, MessageSquareMore, Settings, UserCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/app', label: 'Home', icon: Home },
  { to: '/app/chat', label: 'Chat', icon: MessageSquareMore },
  { to: '/app/profile', label: 'Profile', icon: UserCircle },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-slate-950 text-slate-100 lg:flex">
      <div className="border-b border-slate-800 px-6 py-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Tempo
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          Workspace shell
        </h2>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
