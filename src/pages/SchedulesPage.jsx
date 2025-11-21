import React, { useEffect, useState } from 'react'
import { api } from '../api/mockApi'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const WEEKDAY_MAP = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/* Utilidad: convertir HH:MM a minutos desde medianoche */
function timeToMinutes(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

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
                {t.name}{' '}
                {t.startTime && t.endTime
                  ? `(${t.startTime} - ${t.endTime})`
                  : ''}
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

  // buscador general (para tabla)
  const [search, setSearch] = useState('')

  // filtros exclusivos del calendario
  const [calEmployeeId, setCalEmployeeId] = useState('')
  const [calTurnId, setCalTurnId] = useState('')
  const [calDay, setCalDay] = useState('') // '' = todos

  // filtros de fecha para calendario
  const [calSingleDate, setCalSingleDate] = useState('') // fecha exacta
  const [calRangeStart, setCalRangeStart] = useState('') // desde
  const [calRangeEnd, setCalRangeEnd] = useState('') // hasta

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

  // Enriquecer con empleado y turno
  const enrichedSchedules = schedules.map(s => {
    const emp = employees.find(e => e.id === s.employeeId) || {}
    const turn = turns.find(t => t.id === s.turnId) || {}
    return { ...s, _emp: emp, _turn: turn }
  })

  // ---------------- BUSCADOR GENERAL (TABLA) ----------------
  const normalized = search.trim().toLowerCase()
  const tokens = normalized.split(/\s+/).filter(Boolean)

  const tableSchedules = enrichedSchedules.filter(s => {
    if (tokens.length === 0) return true

    const haystack = [
      s._emp.name || '',
      s._emp.position || '',
      s._turn.name || '',
      (s.days || []).join(' '),
      s.freeDay || '',
      s.startDate || '',
      s.endDate || '',
      s._turn.startTime || '',
      s._turn.endTime || '',
    ]
      .join(' ')
      .toLowerCase()

    return tokens.every(token => haystack.includes(token))
  })

  const total = schedules.length
  const visible = tableSchedules.length

  // ---------------- FILTROS SOLO PARA CALENDARIO ----------------
  const calendarSource = enrichedSchedules.filter(s => {
    // Empleado
    if (calEmployeeId && s.employeeId !== calEmployeeId) return false
    // Turno
    if (calTurnId && s.turnId !== calTurnId) return false
    // Día (nombre)
    if (calDay && (!s.days || !s.days.includes(calDay))) return false

    // --- Filtro por fecha específica (tiene prioridad) ---
    if (calSingleDate) {
      const dStr = calSingleDate

      // Validar rango de fechas del horario (startDate / endDate)
      if (s.startDate && dStr < s.startDate) return false
      if (s.endDate && dStr > s.endDate) return false

      // Debe coincidir el día de la semana
      const dObj = new Date(calSingleDate)
      if (!Number.isNaN(dObj.getTime())) {
        const weekdayName = WEEKDAY_MAP[dObj.getDay()] // Dom..Sáb
        if (s.days && s.days.length && !s.days.includes(weekdayName)) {
          return false
        }
      }
      return true
    }

    // --- Filtro por rango de fechas (si no hay fecha específica) ---
    if (calRangeStart || calRangeEnd) {
      const rangeStart = calRangeStart || '0000-01-01'
      const rangeEnd = calRangeEnd || '9999-12-31'
      const schedStart = s.startDate || '0000-01-01'
      const schedEnd = s.endDate || '9999-12-31'

      const overlap = schedStart <= rangeEnd && schedEnd >= rangeStart
      if (!overlap) return false
    }

    return true
  })

  // Construir estructura para el calendario compacto
  const calendarByDay = {}
  DAYS.forEach(d => {
    calendarByDay[d] = []
  })

  calendarSource.forEach(s => {
    const empName = s._emp.name || 'Sin nombre'
    const turnName = s._turn.name || 'Turno'
    const start = s._turn.startTime
    const end = s._turn.endTime

    const startM = timeToMinutes(start)
    const endM = timeToMinutes(end)

    if (startM == null || endM == null) {
      return
    }

    const isOvernight = endM <= startM

    s.days?.forEach(day => {
      if (!DAYS.includes(day)) return

      if (!isOvernight) {
        calendarByDay[day].push({
          key: s.id + '-' + day + '-normal',
          empName,
          turnName,
          label: `${start}–${end}`,
          continued: false,
        })
      } else {
        // Día de inicio
        calendarByDay[day].push({
          key: s.id + '-' + day + '-overnight-start',
          empName,
          turnName,
          label: `${start}–23:59`,
          continued: false,
        })

        // Día siguiente
        const idx = DAYS.indexOf(day)
        const nextDay = DAYS[(idx + 1) % DAYS.length]

        calendarByDay[nextDay].push({
          key: s.id + '-' + day + '-overnight-continue',
          empName,
          turnName,
          label: `00:00–${end}`,
          continued: true,
        })
      }
    })
  })

  // ---------------- FECHAS DE LA SEMANA PARA EL CALENDARIO ----------------
  // baseDate:
  // - si hay fecha específica, usamos esa
  // - si no, pero hay rango desde, usamos el rango desde
  // - si no, usamos hoy
  let baseDate = new Date()
  if (calSingleDate) {
    const d = new Date(calSingleDate)
    if (!Number.isNaN(d.getTime())) baseDate = d
  } else if (calRangeStart) {
    const d = new Date(calRangeStart)
    if (!Number.isNaN(d.getTime())) baseDate = d
  }

  const jsDay = baseDate.getDay() // 0=Dom,1=Lun,...6=Sáb
  const offset = (jsDay + 6) % 7 // convertimos a índice donde 0=Lun
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() - offset + i)
    return d
  })

  return (
    <div className="space-y-6">
      {/* HEADER + BUSCADOR GENERAL */}
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
              placeholder="Buscar para la tabla: empleado, turno o día..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Este buscador afecta la tabla de horarios. Ejemplos:{' '}
            <i>juan matutino lun vie</i>, <i>nocturno dom</i>.
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
        <div className="max-h-[50vh] overflow-auto">
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
              {tableSchedules.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-slate-400"
                  >
                    No se encontraron horarios con ese criterio de búsqueda.
                  </td>
                </tr>
              )}

              {tableSchedules.map(s => (
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

      {/* CALENDARIO SEMANAL COMPACTO + FILTROS PROPIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-700">
              Vista semanal compacta
            </h4>
            <p className="text-[11px] text-slate-400">
              Filtros exclusivos para el calendario. Si seleccionas una fecha específica, se ignora el rango.
            </p>
          </div>

          {/* Filtros del calendario */}
          <div className="flex flex-wrap gap-3">
            {/* Filtro empleado */}
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">Empleado</span>
              <select
                value={calEmployeeId}
                onChange={e => setCalEmployeeId(e.target.value)}
                className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[160px]"
              >
                <option value="">Todos</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro turno */}
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">Turno</span>
              <select
                value={calTurnId}
                onChange={e => setCalTurnId(e.target.value)}
                className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[160px]"
              >
                <option value="">Todos</option>
                {turns.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro día */}
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">Día</span>
              <select
                value={calDay}
                onChange={e => setCalDay(e.target.value)}
                className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
              >
                <option value="">Todos</option>
                {DAYS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por fecha específica */}
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">
                Fecha específica
              </span>
              <input
                type="date"
                value={calSingleDate}
                onChange={e => setCalSingleDate(e.target.value)}
                className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400">
                Si seleccionas una fecha, se ignora el rango.
              </span>
            </div>

            {/* Filtro por rango de fechas */}
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">
                Rango de fechas
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={calRangeStart}
                  onChange={e => setCalRangeStart(e.target.value)}
                  className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">a</span>
                <input
                  type="date"
                  value={calRangeEnd}
                  onChange={e => setCalRangeEnd(e.target.value)}
                  className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400">
                Solo aplica si no hay fecha específica seleccionada.
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-[11px] uppercase tracking-wide text-slate-600">
                {DAYS.map((day, idx) => {
                  const d = weekDates[idx]
                  const dayNum = d.getDate()
                  const monthNum = d.getMonth() + 1

                  return (
                    <th
                      key={day}
                      className="px-3 py-2 text-left min-w-[150px]"
                    >
                      <div className="flex flex-col">
                        <span>{day}</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          {String(dayNum).padStart(2, '0')}/
                          {String(monthNum).padStart(2, '0')}
                        </span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                {DAYS.map(day => {
                  const blocks = calendarByDay[day] || []
                  return (
                    <td
                      key={day}
                      className="px-3 py-3 align-top border-t border-slate-100"
                    >
                      {blocks.length === 0 ? (
                        <span className="text-[10px] text-slate-300">
                          Sin turnos
                        </span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {blocks.map(b => (
                            <div
                              key={b.key}
                              className="rounded-md bg-blue-50 border border-blue-100 px-2 py-1 text-[11px] text-blue-900"
                            >
                              <div className="font-semibold truncate">
                                {b.empName}
                              </div>
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="px-1 rounded-full bg-blue-100 text-[10px]">
                                  {b.label}
                                </span>
                                <span className="text-[10px}">
                                  {b.turnName}
                                </span>
                                {b.continued && (
                                  <span className="text-[9px] text-blue-700">
                                    (continúa)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
