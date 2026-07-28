import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <aside style={{ width: '240px', padding: '1.5rem', borderRight: '1px solid #e2e8f0' }}>
        <p>Sidebar placeholder</p>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <p>Topbar placeholder</p>
        </header>
        <main style={{ flex: 1, padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
