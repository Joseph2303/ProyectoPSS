import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function WelcomePage() {
  const nav = useNavigate()

  return (
    <div className="py-12 text-center">
      <div className="max-w-2xl mx-auto">
        <img src="/favicon.png" alt="CI" className="mx-auto h-40 w-40 mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Bienvenido a Control Interno</h2>
        <p className="mt-3 text-sm text-slate-600">Sistema de registro y control de entradas, salidas y reportes.</p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => nav('/claves')}
            className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
          >
            Marcas de Empleados
          </button>

          <button
            onClick={() => nav('/reportes')}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver reportes
          </button>
        </div>
      </div>
    </div>
  )
}
