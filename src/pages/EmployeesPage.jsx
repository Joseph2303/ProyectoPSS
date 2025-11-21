import React, { useEffect, useState } from 'react'
import { api } from '../api/mockApi'

/* FORMULARIO DE EMPLEADO */
function EmployeeForm({ onSave, initial }) {
  const [form, setForm] = useState(
    initial || { name: '', position: '', code: '' }
  )

  useEffect(() => {
    setForm(initial || { name: '', position: '', code: '' })
  }, [initial])

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSave(form)
        setForm({ name: '', position: '', code: '' })
      }}
      className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200"
    >
      <input
        placeholder="Nombre completo"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        placeholder="Puesto"
        value={form.position}
        onChange={e => setForm({ ...form, position: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        placeholder="Código"
        value={form.code}
        onChange={e => setForm({ ...form, code: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <button
        className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
      >
        Guardar
      </button>
    </form>
  )
}

/* PÁGINA PRINCIPAL */
export default function EmployeesPage() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setItems(api.getEmployees())
  }, [])

  function refresh() {
    setItems(api.getEmployees())
  }

  function handleSave(emp) {
    if (editing) {
      api.updateEmployee(editing.id, emp)
      setEditing(null)
    } else {
      api.addEmployee(emp)
    }
    refresh()
  }

  // --- BUSCADOR POTENTE ---
  const normalizedSearch = search.trim().toLowerCase()
  const tokens = normalizedSearch.split(/\s+/).filter(Boolean)

  const filteredItems = items.filter(emp => {
    if (tokens.length === 0) return true

    const haystack =
      `${emp.name || ''} ${emp.position || ''} ${emp.code || ''}`.toLowerCase()

    // Cada palabra escrita debe aparecer en algún lugar de los datos
    return tokens.every(token => haystack.includes(token))
  })

  const total = items.length
  const visible = filteredItems.length

  return (
    <div className="space-y-6">
      {/* HEADER + BUSCADOR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Gestión de empleados
          </h2>
          <p className="text-sm text-slate-500">
            Registra, edita o elimina empleados del sistema.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Mostrando <span className="font-semibold">{visible}</span> de{' '}
            <span className="font-semibold">{total}</span> empleados.
          </p>
        </div>

        {/* Buscador */}
        <div className="w-full sm:w-80">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, puesto o código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Puedes escribir varias palabras: ej. <span className="italic">juan bodega</span>.
          </p>
        </div>
      </div>

      {/* FORMULARIO */}
      <EmployeeForm onSave={handleSave} initial={editing} />

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr className="text-slate-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Puesto</th>
              <th className="px-4 py-2 text-left">Código</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-slate-400 py-6"
                >
                  No se encontraron empleados con ese criterio de búsqueda.
                </td>
              </tr>
            )}

            {filteredItems.map(it => (
              <tr
                key={it.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition"
              >
                <td className="px-4 py-2">{it.name}</td>
                <td className="px-4 py-2">{it.position}</td>
                <td className="px-4 py-2">{it.code}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => setEditing(it)}
                    className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => {
                      api.deleteEmployee(it.id)
                      refresh()
                    }}
                    className="px-3 py-1 rounded-md bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
