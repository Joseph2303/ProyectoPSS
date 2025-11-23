import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { api } from './api/mockApi'
import EmployeesPage from './pages/EmployeesPage'
import TurnsPage from './pages/TurnsPage'
import SchedulesPage from './pages/SchedulesPage'
import KeysPage from './pages/KeysPage'
import ReportsPage from './pages/ReportsPage'
import WelcomePage from './pages/WelcomePage'
import { Toaster, toast } from 'react-hot-toast'

export default function App() {
  // ya no usamos status local, todo será con toast
  // const [status, setStatus] = React.useState('')

  function doSeed() {
    api.seedSampleData()
    toast.success('Datos de ejemplo cargados.')
    setTimeout(() => window.location.reload(), 400)
  }

  function doReset() {
    if (!confirm('¿Restablecer almacenamiento local y recargar?')) return
    api.resetStore()
    toast('Almacenamiento eliminado. Recargando...', { icon: '🧹' })
    setTimeout(() => window.location.reload(), 600)
  }

  function doExport() {
    const data = api.exportState()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ci_export.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Exportado ci_export.json')
  }

  const navLinkClass = ({ isActive }) =>
    [
      'px-4 py-2 rounded-full text-sm font-medium transition-colors',
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100',
    ].join(' ')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="CI" className="h-10 w-10 md:h-20 md:w-20" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Control Interno
              </h1>
              <p className="text-xs md:text-sm text-slate-500">
                P.S.S, Profesional Security Services S.A.
              </p>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={doSeed}
              className="hidden md:inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Datos ejemplo
            </button>
          </div>
        </div>

        {/* Navegación principal */}
        <div className="border-t border-slate-200 bg-white/60">
          <nav className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Inicio
            </NavLink>
            <NavLink to="/empleados" className={navLinkClass}>
              Empleados
            </NavLink>
            <NavLink to="/turnos" className={navLinkClass}>
              Turnos
            </NavLink>
            <NavLink to="/horarios" className={navLinkClass}>
              Horarios
            </NavLink>
            <NavLink to="/claves" className={navLinkClass}>
              Registro de Claves
            </NavLink>
            <NavLink to="/reportes" className={navLinkClass}>
              Reportes
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <section className="bg-white/90 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 p-4 md:p-6">
          <Routes>
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/" element={<WelcomePage />} />
            <Route path="/empleados" element={<EmployeesPage />} />
            <Route path="/turnos" element={<TurnsPage />} />
            <Route path="/horarios" element={<SchedulesPage />} />
            <Route path="/claves" element={<KeysPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
          </Routes>
        </section>
      </main>

      {/* Toaster global para TODA la app */}
      <Toaster position="top-right" />
    </div>
  )
}
