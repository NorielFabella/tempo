export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Workspace</p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Tempo</h1>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
          Productive workspace
        </div>
      </div>
    </header>
  )
}
