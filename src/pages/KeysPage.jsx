import React, { useEffect, useState } from 'react'
import { api } from '../api/mockApi'

const WEEKDAY_MAP = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function timeNowStr() {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function isTimeInRange(now, start, end) {
  if (!start || !end) return true
  if (start === end) return true
  if (start < end) {
    return now >= start && now <= end
  }
  return now >= start || now <= end
}

function isScheduleActive(sch, turns, nowStr, today) {
  if (sch.startDate && today < sch.startDate) return false
  if (sch.endDate && today > sch.endDate) return false
  const weekday = WEEKDAY_MAP[new Date().getDay()]
  if (sch.days && sch.days.length && !sch.days.includes(weekday)) return false
  if (sch.turnId) {
    const turn = turns.find(t => t.id === sch.turnId)
    if (turn) {
      return isTimeInRange(nowStr, turn.startTime, turn.endTime)
    }
  }
  return true
}

function EmployeeRow({
  emp,
  turns,
  keys,
  onAddKey,
  onCloseKey,
  defaultTurnId,
  nowTick,
  breakDefaults,
}) {
  const [input, setInput] = useState('')

  const turn = turns.find(t => t.id === defaultTurnId)

  // último shift_in
  const lastIn = keys
    .filter(k => k.employeeId === emp.id && k.type === 'shift_in')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

  const hasOut = lastIn
    ? keys.some(
        k =>
          k.employeeId === emp.id &&
          k.type === 'shift_out' &&
          new Date(k.createdAt) > new Date(lastIn.createdAt)
      )
    : false

  const inShift = !!lastIn && !hasOut

  return (
    <tr
      className={
        'border-b border-slate-100 last:border-0 ' +
        (inShift ? 'bg-emerald-50/60' : 'hover:bg-slate-50')
      }
      id={`emp-${emp.id}`}
    >
      {/* ACCIÓN */}
      <td className="align-top w-56 px-3 py-3">
        <div className="flex flex-col gap-2">
          {!inShift ? (
            <button
              onClick={() => onAddKey(emp.id, 'ENTRADA', 'shift_in')}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              Marcar entrada
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                En turno desde {new Date(lastIn.createdAt).toLocaleTimeString()}
              </div>
              <button
                onClick={() => onAddKey(emp.id, 'SALIDA', 'shift_out')}
                className="inline-flex items-center justify-center rounded-full border border-emerald-600/20 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
              >
                Marcar salida
              </button>
            </div>
          )}
        </div>
      </td>

      {/* EMPLEADO */}
      <td className="min-w-[220px] px-3 py-3 align-top">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900">{emp.name}</span>
          <span className="text-xs text-slate-500">{emp.position}</span>
        </div>
      </td>

      {/* TURNO */}
      <td className="px-3 py-3 align-top">
        <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700">
          {turn
            ? `${turn.name} · ${turn.startTime || '-'} — ${turn.endTime || '-'}`
            : 'Sin turno activo'}
        </div>
      </td>

      {/* DESCANSOS RÁPIDOS: diseño tipo tarjeta 2 columnas */}
      <td className="w-72 px-3 py-3 align-top">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Almuerzo / Cena */}
          <div className="rounded-md overflow-hidden border border-slate-300 bg-slate-200">
            <div className="bg-cyan-900 px-3 py-1 text-[11px] font-semibold text-white">
              Almuerzo / Cena
            </div>
            <div className="flex items-center justify-center py-6">
              <button
                onClick={() =>
                  onAddKey(emp.id, 'Almuerzo/Cena', 'break_start', {
                    breakType: 'almuerzo_cena',
                    duration: breakDefaults.almuerzo,
                  })
                }
                className="rounded-full bg-cyan-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-800 transition"
              >
                Comienza tiempo
              </button>
            </div>
          </div>

          {/* Desayuno / Café */}
          <div className="rounded-md overflow-hidden border border-slate-300 bg-slate-200">
            <div className="bg-cyan-900 px-3 py-1 text-[11px] font-semibold text-white">
              Desayuno / Café
            </div>
            <div className="flex items-center justify-center py-6">
              <button
                onClick={() =>
                  onAddKey(emp.id, 'Desayuno/Café', 'break_start', {
                    breakType: 'desayuno_cafe',
                    duration: breakDefaults.desayuno,
                  })
                }
                className="rounded-full bg-cyan-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-800 transition"
              >
                Comienza tiempo
              </button>
            </div>
          </div>
        </div>
      </td>

      {/* INPUT CLAVE */}
      <td className="px-3 py-3 align-top">
        <div className="flex items-center gap-2">
          <input
            className="emp-input w-28 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Clave"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.ctrlKey) {
                e.preventDefault()
                if (input) {
                  onAddKey(emp.id, input)
                  setInput('')
                }
              }
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault()
                onAddKey(emp.id, 'SALIDA', 'shift_out')
              }
            }}
          />
          <button
            onClick={() => {
              if (!input) return
              onAddKey(emp.id, input)
              setInput('')
            }}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            OK
          </button>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          Enter = registrar clave · Ctrl+Enter = salida rápida
        </p>
      </td>

      {/* CLAVES ABIERTAS + HISTORIAL */}
      <td className="px-3 py-3 align-top">
        <div className="space-y-3">
          {/* Claves abiertas */}
          <div className="flex flex-wrap gap-2">
            {keys
              .filter(k => k.employeeId === emp.id && !k.closedAt)
              .map(k => (
                <div
                  key={k.id}
                  className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1 text-[11px] shadow-sm"
                >
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold">{k.clave}</span>
                    {k.type === 'break_start' && k.meta?.breakType && (
                      <span className="text-[10px] text-slate-300">
                        {k.meta.breakType}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-200">
                    {new Date(k.createdAt).toLocaleTimeString()}
                  </span>
                  {k.type === 'break_start' && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-100">
                      {Math.floor(
                        (nowTick - new Date(k.createdAt)) / 1000
                      )}
                      s
                    </span>
                  )}
                  <button
                    onClick={() => onCloseKey(k.id)}
                    className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] hover:bg-white/20 transition"
                  >
                    Cerrar
                  </button>
                </div>
              ))}
          </div>

          {/* Historial corto */}
          <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2 max-h-40 overflow-y-auto">
            {keys
              .filter(k => k.employeeId === emp.id)
              .slice(-5)
              .reverse()
              .map(h => {
                const start = new Date(h.createdAt)
                const end = h.closedAt ? new Date(h.closedAt) : null
                const durationMs = end ? end - start : 0
                const durationMin = end ? Math.round(durationMs / 60000) : null
                const durationStr = end
                  ? durationMin >= 60
                    ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
                    : `${durationMin}m`
                  : null

                return (
                  <div
                    key={h.id}
                    className="flex justify-between gap-3 border-b border-slate-100 pb-1 last:border-0 last:pb-0"
                  >
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">
                        {h.clave}
                      </span>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        {h.type || 'clave'}
                      </div>
                    </div>
                    <div className="text-[10px] text-right text-slate-500 space-y-0.5">
                      <div>
                        <span className="font-semibold text-slate-400">
                          Inicio:{' '}
                        </span>
                        {start.toLocaleString()}
                      </div>
                      {end ? (
                        <div>
                          <span className="font-semibold text-slate-400">
                            Fin:{' '}
                          </span>
                          {end.toLocaleString()}{' '}
                          <span className="ml-1 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-semibold text-slate-700">
                            {durationStr}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-amber-600">
                          <span className="font-semibold text-[10px]">
                            Abierto
                          </span>
                          <span>• {start.toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function KeysPage() {
  const [keys, setKeys] = useState([])
  const [employees, setEmployees] = useState([])
  const [turns, setTurns] = useState([])
  const [schedules, setSchedules] = useState([])
  const [activeEmployees, setActiveEmployees] = useState([])
  const [nowTick, setNowTick] = useState(Date.now())
  const [breakDefaults] = useState({
    desayuno: 15,
    cafe: 10,
    almuerzo: 60,
    cena: 45,
  })

  // búsqueda y filtro
  const [search, setSearch] = useState('')
  const [onlyWithOpenKeys, setOnlyWithOpenKeys] = useState(false)

  function refreshAll() {
    const ks = api.getKeys()
    const es = api.getEmployees()
    const ts = api.getTurns()
    const ss = api.getSchedules()
    setKeys(ks)
    setEmployees(es)
    setTurns(ts)
    setSchedules(ss)

    const nowStr = timeNowStr()
    const today = new Date().toISOString().slice(0, 10)
    const active = es.filter(emp =>
      ss.some(
        s =>
          s.employeeId === emp.id &&
          isScheduleActive(s, ts, nowStr, today)
      )
    )
    setActiveEmployees(active)
  }

  useEffect(() => {
    refreshAll()
    const t = setInterval(() => refreshAll(), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const ti = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(ti)
  }, [])

  useEffect(() => {
    setTimeout(() => {
      const el = document.querySelector('.emp-input')
      if (el) el.focus()
    }, 50)
  }, [activeEmployees])

  function defaultTurnForEmployee(emp) {
    const nowStr = timeNowStr()
    const today = new Date().toISOString().slice(0, 10)
    const s = schedules.find(
      sc =>
        sc.employeeId === emp.id &&
        isScheduleActive(sc, turns, nowStr, today)
    )
    return s?.turnId || ''
  }

  function addKey(employeeId, clave, type = 'clave', meta = {}) {
    const emp = employees.find(e => e.id === employeeId)
    const defaultTurn = defaultTurnForEmployee(emp)

    if (type === 'shift_out') {
      const ks = api.getKeys()
      const lastIn = ks
        .filter(
          k =>
            k.employeeId === employeeId &&
            k.type === 'shift_in' &&
            !k.closedAt
        )
        .sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0]

      if (lastIn) {
        api.updateKey(lastIn.id, {
          closedAt: new Date().toISOString(),
        })
        refreshAll()
        return
      }

      api.addKey({ employeeId, turnId: defaultTurn, clave, type, meta })
      refreshAll()
      return
    }

    api.addKey({ employeeId, turnId: defaultTurn, clave, type, meta })
    refreshAll()
  }

  function closeKey(id) {
    api.closeKey(id)
    refreshAll()
  }

  const openKeysCount = keys.filter(
    k =>
      !k.closedAt &&
      activeEmployees.some(emp => emp.id === k.employeeId)
  ).length

  const currentTime = new Date(nowTick).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  // aplicar búsqueda y filtro
  const normalizedSearch = search.trim().toLowerCase()
  const filteredEmployees = activeEmployees.filter(emp => {
    const matchesSearch =
      !normalizedSearch ||
      emp.name.toLowerCase().includes(normalizedSearch) ||
      (emp.position || '').toLowerCase().includes(normalizedSearch)

    if (!matchesSearch) return false

    if (!onlyWithOpenKeys) return true

    const hasOpen = keys.some(
      k => k.employeeId === emp.id && !k.closedAt
    )
    return hasOpen
  })

  return (
    <div className="space-y-4">
      {/* Header de la vista */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Registro de claves en tiempo real
          </h2>
          <p className="text-sm text-slate-500">
            Control de entradas, salidas y descansos por persona empleada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">
              {activeEmployees.length} en servicio
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="font-semibold text-slate-700">
              {openKeysCount} claves abiertas
            </span>
          </div>
          <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-mono text-slate-100">
            {currentTime}
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* Buscador */}
        <div className="flex-1 min-w-[260px]">
          <input
            type="text"
            placeholder="Buscar empleado o puesto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtro: Solo con claves abiertas */}
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={onlyWithOpenKeys}
            onChange={e => setOnlyWithOpenKeys(e.target.checked)}
          />
          <span>Mostrar solo quienes tienen claves abiertas</span>
        </label>
      </div>

      {/* Tabla principal */}
      <div className="mt-2 rounded-xl border border-slate-100 bg-white">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full table-auto border-collapse text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 text-left font-semibold">
                  Acción
                </th>
                <th className="px-3 py-2 text-left font-semibold">
                  Empleado
                </th>
                <th className="px-3 py-2 text-left font-semibold">
                  Turno
                </th>
                <th className="px-3 py-2 text-left font-semibold">
                  Descansos rápidos
                </th>
                <th className="px-3 py-2 text-left font-semibold">
                  Registrar clave
                </th>
                <th className="px-3 py-2 text-left font-semibold">
                  Claves abiertas e historial
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-400"
                  >
                    No hay coincidencias con la búsqueda o no hay personas
                    en servicio.
                  </td>
                </tr>
              )}

              {filteredEmployees.map(emp => (
                <EmployeeRow
                  key={emp.id}
                  emp={emp}
                  turns={turns}
                  keys={keys}
                  onAddKey={addKey}
                  onCloseKey={closeKey}
                  defaultTurnId={defaultTurnForEmployee(emp)}
                  nowTick={nowTick}
                  breakDefaults={breakDefaults}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
