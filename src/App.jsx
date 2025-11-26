import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { api } from './api/mockApi'
import EmployeesPage from './pages/EmployeesPage'
import TurnsPage from './pages/TurnsPage'
import SchedulesPage from './pages/SchedulesPage'
import KeysPage from './pages/KeysPage'
import ReportsPage from './pages/ReportsPage'
import WelcomePage from './pages/WelcomePage'
import PositionsPage from './pages/PositionsPage'
import { Toaster, toast } from 'react-hot-toast'

function MobileSidebar() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function handler(e) {
      setOpen(true)
    }
    window.addEventListener('toggleSidebar', handler)
    return () => window.removeEventListener('toggleSidebar', handler)
  }, [])

  return (
    <>{open && (
      <div className="fixed inset-0 z-40 md:hidden">
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <aside className="relative w-64 h-full bg-white p-4">
          <button className="mb-4 p-2 rounded-md bg-slate-100" onClick={() => setOpen(false)}>
            Cerrar
          </button>
          <nav className="flex flex-col gap-2">
            <NavLink to="/" className={({isActive}) => 'px-3 py-2 rounded ' + (isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100') } end>Inicio</NavLink>
            <NavLink to="/empleados" className={({isActive}) => 'px-3 py-2 rounded ' + (isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100') }>Empleados</NavLink>
            <NavLink to="/jornadas" className={({isActive}) => 'px-3 py-2 rounded ' + (isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100') }>Jornadas</NavLink>
            <NavLink to="/puestos" className={({isActive}) => 'px-3 py-2 rounded ' + (isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100') }>Puestos</NavLink>
            <NavLink to="/horarios" className={({isActive}) => 'px-3 py-2 rounded ' + (isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100') }>Horarios</NavLink>
            <NavLink to="/claves" className={({isActive}) => 'px-3 py-2 rounded ' + (isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100') }>Registro de Claves</NavLink>
            <NavLink to="/reportes" className={({isActive}) => 'px-3 py-2 rounded ' + (isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100') }>Reportes</NavLink>
          </nav>
        </aside>
      </div>
    )}</>
  )
}

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
            {/* botón para abrir sidebar en móvil */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar', { detail: { open: true } }))}
              className="md:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
              aria-label="Abrir menú"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

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
        {/* Nota: la navegación pasa al sidebar izquierdo (ver `main`) */}
      </header>

      {/* Contenido con sidebar izquierdo */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:ml-56">
        <div className="flex gap-6">
          {/* Sidebar escritorio (fijo a la izquierda, fondo blanco) */}
          <aside className="hidden md:block fixed left-0 top-20 h-[calc(100vh-6rem)] w-56 bg-white border-r border-slate-200 p-4 z-10">
            <br />
            <br />
            <nav className="flex flex-col gap-2 sticky top-2">
              <NavLink to="/" className={navLinkClass} end>
                Inicio
              </NavLink>
              <NavLink to="/empleados" className={navLinkClass}>
                Empleados
              </NavLink>
              <NavLink to="/jornadas" className={navLinkClass}>
                Jornadas
              </NavLink>
              <NavLink to="/puestos" className={navLinkClass}>
                Puestos
              </NavLink>
              <NavLink to="/horarios" className={navLinkClass}>
                Horarios
              </NavLink>
              <NavLink to="/claves" className={navLinkClass}>
                Marcas de Empleados
              </NavLink>
              <NavLink to="/reportes" className={navLinkClass}>
                Reportes
              </NavLink>
            </nav>
          </aside>

          {/* Contenido principal */}
          <div className="flex-1">
            <section className="bg-white/90 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 p-4 md:p-6">
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
          </div>
        </div>
      </main>

      {/* Sidebar móvil: escucha evento custom para abrir */}
      <MobileSidebar />

      {/* Toaster global para TODA la app */}
      <Toaster position="top-right" />
    </div>
  )
}
