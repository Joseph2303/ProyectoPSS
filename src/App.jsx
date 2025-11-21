import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { api } from './api/mockApi'
import EmployeesPage from './pages/EmployeesPage'
import TurnsPage from './pages/TurnsPage'
import SchedulesPage from './pages/SchedulesPage'
import KeysPage from './pages/KeysPage'

export default function App() {
  const [status, setStatus] = React.useState('')

  function doSeed() {
    api.seedSampleData()
    setStatus('Datos de ejemplo cargados.')
    setTimeout(() => setStatus(''), 3000)
    window.location.reload()
  }

  function doReset() {
    if (!confirm('¿Restablecer almacenamiento local y recargar?')) return
    api.resetStore()
    setStatus('Almacenamiento eliminado. Recargando...')
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
    setStatus('Exportado ci_export.json')
    setTimeout(() => setStatus(''), 2000)
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
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Control Interno
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              Gestión de empleados, turnos, horarios y registro de claves.
            </p>
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

            <button
              type="button"
              onClick={doExport}
              className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar
            </button>

            <button
              type="button"
              onClick={doReset}
              className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Reset
            </button>
          </div>
        </div>

        {/* Navegación principal */}
        <div className="border-t border-slate-200 bg-white/60">
          <nav className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
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
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Barra de estado */}
        {status && (
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm text-slate-600 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{status}</span>
            </div>
          </div>
        )}

        <section className="bg-white/90 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 p-4 md:p-6">
          <Routes>
            <Route path="/" element={<EmployeesPage />} />
            <Route path="/turnos" element={<TurnsPage />} />
            <Route path="/horarios" element={<SchedulesPage />} />
            <Route path="/claves" element={<KeysPage />} />
          </Routes>
        </section>
      </main>
    </div>
  )
}
