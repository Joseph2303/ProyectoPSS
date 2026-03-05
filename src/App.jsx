import React from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { api } from './api/mockApi'
import EmployeesPage from './pages/EmployeesPage'
import TurnsPage from './pages/TurnsPage'
import SchedulesPage from './pages/SchedulesPage'
import KeysPage from './pages/KeysPage'
import ReportsPage from './pages/ReportsPage'
import WelcomePage from './pages/WelcomePage'
import PositionsPage from './pages/PositionsPage'
import { Toaster, toast } from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/empleados', label: 'Empleados', icon: 'users' },
  { to: '/jornadas', label: 'Jornadas', icon: 'clock' },
  { to: '/puestos', label: 'Puestos', icon: 'badge' },
  { to: '/horarios', label: 'Horarios', icon: 'calendar' },
  { to: '/claves', label: 'Marcas de Empleados', icon: 'check' },
  { to: '/reportes', label: 'Reportes', icon: 'chart' },
]

function NavIcon({ name, active = false }) {
  const cls = active ? 'text-white' : 'text-slate-500'

  if (name === 'home') {
    return <svg className={`h-4 w-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" /></svg>
  }
  if (name === 'users') {
    return <svg className={`h-4 w-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" /></svg>
  }
  if (name === 'clock') {
    return <svg className={`h-4 w-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
  }
  if (name === 'badge') {
    return <svg className={`h-4 w-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3 4 7v6c0 5 3.5 7.7 8 8 4.5-.3 8-3 8-8V7l-8-4Zm0 6v4m0 4h.01" /></svg>
  }
  if (name === 'calendar') {
    return <svg className={`h-4 w-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 2v3m8-3v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
  }
  if (name === 'check') {
    return <svg className={`h-4 w-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
  }

  return <svg className={`h-4 w-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 14l3-3 3 2 4-5" /></svg>
}

function MobileSidebar() {
  const [open, setOpen] = React.useState(false)
  const location = useLocation()

  React.useEffect(() => {
    function handler(e) {
      setOpen(e?.detail?.open !== false)
    }
    window.addEventListener('toggleSidebar', handler)
    return () => window.removeEventListener('toggleSidebar', handler)
  }, [])

  React.useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  React.useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>{open && (
      <div className="fixed inset-0 z-40 md:hidden">
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <aside className="relative h-full w-[min(19rem,88vw)] border-r border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Navegacion</p>
              <p className="text-sm font-semibold text-slate-900">Control Interno</p>
            </div>
            <button className="rounded-lg bg-slate-100 p-2 text-slate-600" onClick={() => setOpen(false)} aria-label="Cerrar menu">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => [
                  'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100',
                ].join(' ')}
              >
                {({ isActive }) => (
                  <>
                    <NavIcon name={item.icon} active={isActive} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>
    )}</>
  )
}

export default function App() {
  function doSeed() {
    api.seedSampleData()
    toast.success('Datos de ejemplo cargados.')
    setTimeout(() => window.location.reload(), 400)
  }

  const navLinkClass = ({ isActive }) =>
    [
      'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ].join(' ')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar', { detail: { open: true } }))}
              className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200 md:hidden"
              aria-label="Abrir menu"
            >
              <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <img src="/favicon.png" alt="CI" className="h-10 w-10 md:h-14 md:w-14" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">Control Interno</h1>
              <p className="text-xs text-slate-500 md:text-sm">P.S.S, Profesional Security Services S.A.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={doSeed}
              className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 md:inline-flex"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Datos ejemplo
            </button>
          </div>
        </div>

        <nav className="hidden border-t border-slate-200/80 bg-white/70 md:block">
          <div className="mx-auto w-full max-w-[1800px] px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {NAV_ITEMS.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                  {({ isActive }) => (
                    <>
                      <NavIcon name={item.icon} active={isActive} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1800px] px-3 py-3 sm:px-4 sm:py-5">
        <section className="rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-md shadow-slate-200/50 sm:p-4 md:p-6">
          <Routes>
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/" element={<WelcomePage />} />
            <Route path="/empleados" element={<EmployeesPage />} />
            <Route path="/jornadas" element={<TurnsPage />} />
            <Route path="/horarios" element={<SchedulesPage />} />
            <Route path="/claves" element={<KeysPage />} />
            <Route path="/puestos" element={<PositionsPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
          </Routes>
        </section>
      </main>

      <MobileSidebar />
      <Toaster position="top-right" />
    </div>
  )
}
