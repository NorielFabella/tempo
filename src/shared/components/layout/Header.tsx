import { Menu } from 'lucide-react'

type HeaderProps = {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
      <div className="flex min-h-10 items-center">
        <button
          type="button"
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="ml-2 min-w-0 lg:ml-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Tempo
          </h1>
        </div>
      </div>
    </header>
  )
}
