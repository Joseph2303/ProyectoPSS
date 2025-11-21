import React, { useEffect, useState } from 'react'
import { api } from '../api/mockApi'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/* FORMULARIO DE HORARIO */
function ScheduleForm({ onSave, initial, employees, turns }) {
  const empty = {
    employeeId: '',
    turnId: '',
    days: [],
    freeDay: '',
    startDate: '',
    endDate: '',
  }

  const [form, setForm] = useState(initial || empty)

  useEffect(() => {
    setForm(initial || empty)
  }, [initial])

  function toggleDay(d) {
    setForm(f => ({
      ...f,
      days: f.days.includes(d)
        ? f.days.filter(x => x !== d)
        : [...f.days, d],
    }))
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSave(form)
        setForm(empty)
      }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200"
    >
      {/* Columna izquierda */}
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">
            Empleado
          </label>
          <select
            value={form.employeeId}
            onChange={e =>
              setForm({ ...form, employeeId: e.target.value })
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione un empleado...</option>
            {employees.map(em => (
              <option key={em.id} value={em.id}>
                {em.name} {em.position ? `(${em.position})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">
            Turno
          </label>
          <select
            value={form.turnId}
            onChange={e =>
              setForm({ ...form, turnId: e.target.value })
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione un turno...</option>
            {turns.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">
            Días de trabajo
          </label>
          <div className="flex flex-wrap gap-2 mt-1">
            {DAYS.map(d => (
              <label
                key={d}
                className={
                  'cursor-pointer rounded-full border px-3 py-1 text-xs flex items-center gap-1 ' +
                  (form.days.includes(d)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100')
                }
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={form.days.includes(d)}
                  onChange={() => toggleDay(d)}
                />
                {d}
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Puedes seleccionar varios días para el mismo horario.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">
            Día libre
          </label>
          <input
            value={form.freeDay}
            onChange={e =>
              setForm({ ...form, freeDay: e.target.value })
            }
            placeholder="Ejemplo: Dom"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">
            Fecha de inicio
          </label>
          <input
            type="date"
            value={form.startDate || ''}
            onChange={e =>
              setForm({ ...form, startDate: e.target.value })
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">
            Fecha de fin
          </label>
          <input
            type="date"
            value={form.endDate || ''}
            onChange={e =>
              setForm({ ...form, endDate: e.target.value })
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-400">
            Puedes dejar la fecha de fin vacía si el horario es indefinido.
          </p>
        </div>

        <div className="pt-2">
          <button
            className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            Guardar horario
          </button>
        </div>
      </div>
    </form>
  )
}

/* PÁGINA PRINCIPAL DE HORARIOS */
export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([])
  const [employees, setEmployees] = useState([])
  const [turns, setTurns] = useState([])
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setSchedules(api.getSchedules())
    setEmployees(api.getEmployees())
    setTurns(api.getTurns())
  }, [])

  function refresh() {
    setSchedules(api.getSchedules())
  }

  function save(form) {
    if (!form.employeeId || !form.turnId) {
      alert('Seleccione empleado y turno')
      return
    }
    if (editing) {
      api.updateSchedule(editing.id, form)
      setEditing(null)
    } else {
      api.addSchedule(form)
    }
    refresh()
  }

  function remove(id) {
    if (!confirm('¿Eliminar horario?')) return
    api.deleteSchedule(id)
    refresh()
  }

  // --- BUSCADOR POTENTE ---
  const normalized = search.trim().toLowerCase()
  const tokens = normalized.split(/\s+/).filter(Boolean)

  const enrichedSchedules = schedules.map(s => {
    const emp = employees.find(e => e.id === s.employeeId) || {}
    const turn = turns.find(t => t.id === s.turnId) || {}
    return { ...s, _emp: emp, _turn: turn }
  })

  const filteredSchedules = enrichedSchedules.filter(s => {
    if (tokens.length === 0) return true

    const haystack = [
      s._emp.name || '',
      s._emp.position || '',
      s._turn.name || '',
      (s.days || []).join(' '),
      s.freeDay || '',
      s.startDate || '',
      s.endDate || '',
    ]
      .join(' ')
      .toLowerCase()

    return tokens.every(token => haystack.includes(token))
  })

  const total = schedules.length
  const visible = filteredSchedules.length

  return (
    <div className="space-y-6">
      {/* HEADER + BUSCADOR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Horarios de trabajo
          </h2>
          <p className="text-sm text-slate-500">
            Asigna turnos y días de trabajo a cada persona empleada.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Mostrando <span className="font-semibold">{visible}</span> de{' '}
            <span className="font-semibold">{total}</span> horarios.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Un empleado puede tener varios horarios activos si es necesario.
          </p>
        </div>

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
              placeholder="Buscar por empleado, turno o día..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Ejemplos: <i>juan matutino lun vie</i>, <i>nocturno dom</i>.
          </p>
        </div>
      </div>

      {/* FORMULARIO */}
      <ScheduleForm
        onSave={save}
        initial={editing}
        employees={employees}
        turns={turns}
      />

      {/* TABLA DE HORARIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <h4 className="px-4 pt-3 pb-2 text-sm font-semibold text-slate-700 border-b border-slate-100">
          Horarios existentes
        </h4>
        <div className="max-h-[60vh] overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-xs uppercase tracking-wide text-slate-600">
                <th className="px-4 py-2 text-left">Empleado</th>
                <th className="px-4 py-2 text-left">Turno</th>
                <th className="px-4 py-2 text-left">Días</th>
                <th className="px-4 py-2 text-left">Día libre</th>
                <th className="px-4 py-2 text-left">Inicio</th>
                <th className="px-4 py-2 text-left">Fin</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-slate-400"
                  >
                    No se encontraron horarios con ese criterio de búsqueda.
                  </td>
                </tr>
              )}

              {filteredSchedules.map(s => (
                <tr
                  key={s.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-2">
                    {s._emp.name || '—'}
                    {s._emp.position && (
                      <span className="ml-1 text-[11px] text-slate-400">
                        ({s._emp.position})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{s._turn.name || '—'}</td>
                  <td className="px-4 py-2">
                    {s.days && s.days.length
                      ? s.days.join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-2">{s.freeDay || '—'}</td>
                  <td className="px-4 py-2">{s.startDate || '—'}</td>
                  <td className="px-4 py-2">{s.endDate || '—'}</td>
                  <td className="px-4 py-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => setEditing(s)}
                      className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(s.id)}
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
    </div>
  )
}
