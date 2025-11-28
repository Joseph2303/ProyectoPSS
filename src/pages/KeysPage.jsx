import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api/mockApi'

const WEEKDAY_MAP = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// timeNowStr defined below with optional timestamp support

function toLocalYYYYMMDD(ts) {
  const d = ts ? new Date(ts) : new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// allow optional timestamp so callers can use the same clock (nowTick)
function timeNowStr(ts) {
  const d = ts ? new Date(ts) : new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function isTimeInRange(now, start, end) {
  if (!start || !end) return true
  if (start === end) return true
  if (start < end) return now >= start && now <= end
  return now >= start || now <= end
}

function isScheduleActive(sch, turns, nowStr, today) {
  if (!sch) return false
  if (sch.startDate && today < sch.startDate) return false
  if (sch.endDate && today > sch.endDate) return false
  // compute weekday from provided `today` (local date YYYY-MM-DD)
  const weekday = WEEKDAY_MAP[new Date((today || toLocalYYYYMMDD()).concat('T00:00:00')).getDay()]
  if (sch.days && sch.days.length && !sch.days.includes(weekday)) return false
  if (sch.turnId) {
    const turn = turns.find(t => String(t.id) === String(sch.turnId))
    if (turn) {
      // Mostrar empleado 20 minutos antes del inicio del turno
      const earlyMinutes = 20

      const parseHHMM = (s) => {
        if (!s) return null
        const [hh, mm] = s.split(':').map(x => parseInt(x || '0', 10))
        return hh * 60 + mm
      }

      const startMin = parseHHMM(turn.startTime)
      const endMin = parseHHMM(turn.endTime)
      if (startMin == null || endMin == null) return true

      let startAdj = startMin - earlyMinutes
      if (startAdj < 0) startAdj += 24 * 60

      const [nh, nm] = nowStr.split(':').map(x => parseInt(x || '0', 10))
      const nowMin = nh * 60 + nm

      if (startAdj === endMin) return true
      if (startAdj < endMin) return nowMin >= startAdj && nowMin <= endMin
      return nowMin >= startAdj || nowMin <= endMin
    }
  }
  return true
}

function EmployeeRow({ emp, turns, keys, onAddKey, onCloseKey, defaultTurnId, nowTick, breakDefaults, requestConfirm, markedRows, setMarkedRows, schedules }) {
  const [input, setInput] = useState('')

  const openBreak = (type) =>
    keys
      .filter(k => String(k.employeeId) === String(emp.id) && k.type === 'break_start' && !k.closedAt && k.meta?.breakType === type)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

  const openBreakAlm = openBreak('almuerzo')
  const openBreakDes = openBreak('desayuno_cafe')

  const openIn = keys
    .filter(k => String(k.employeeId) === String(emp.id) && k.type === 'shift_in' && !k.closedAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

  const now = new Date(nowTick)
  const todayStr = toLocalYYYYMMDD(nowTick)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  // si hay un shift_in abierto, usar su turnId para mostrar la jornada actual
  const displayTurnId = openIn?.turnId || defaultTurnId
  // elegir el turno a usar para calcular estado (preferir openIn.turnId)
  const turn = turns.find(t => String(t.id) === String(displayTurnId))
  let status = 'idle'
  if (openIn) status = 'active'
  else if (turn && turn.startTime) {
    const [sh, sm] = turn.startTime.split(':').map(s => parseInt(s || '0', 10))
    const startMinutes = (isNaN(sh) ? 0 : sh) * 60 + (isNaN(sm) ? 0 : sm)
    const lateThreshold = 5
    const absentThreshold = 15
    if (nowMinutes >= startMinutes + absentThreshold) status = 'absent'
    else if (nowMinutes >= startMinutes + lateThreshold) status = 'late'
  }

  const statusClass = status === 'active' ? 'bg-emerald-50' : status === 'late' ? 'bg-amber-50' : status === 'absent' ? 'bg-red-50' : ''

  const hasStartedToday = keys.some(k => String(k.employeeId) === String(emp.id) && k.type === 'shift_in' && new Date(k.createdAt).toISOString().slice(0,10) === todayStr)
  const disableMarkForAbsent = status === 'absent'

  const lastShiftToday = keys
    .filter(k => String(k.employeeId) === String(emp.id) && k.type === 'shift_in' && new Date(k.createdAt).toISOString().slice(0,10) === todayStr)
    .sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))[0]
  const closedEarlier = lastShiftToday && lastShiftToday.closedAt && new Date(lastShiftToday.closedAt) <= new Date(nowTick)

  const disableAll = disableMarkForAbsent || closedEarlier
  const isMarked = Array.isArray(markedRows) && markedRows.includes(emp.id)
  const enabled = !disableAll && (openIn || isMarked)

  const empKeys = keys
    .filter(k => String(k.employeeId) === String(emp.id))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const sessions = []
  const loose = []
  let current = null
  for (const k of empKeys) {
    if (k.type === 'shift_in') {
      current = { start: k, items: [] }
      sessions.push(current)
    } else if (k.type === 'shift_out') {
      if (current && !current.start.closedAt) {
        current.start.closedAt = k.createdAt
        current = null
        } else loose.push(k)
    }
  }

  const timeline = []
  for (const s of sessions) timeline.push({ type: 'session', time: new Date(s.start.createdAt), session: s })
  for (const l of loose) timeline.push({ type: 'loose', time: new Date(l.createdAt), item: l })
  timeline.sort((a, b) => b.time - a.time)

  // preparar nombre de jornada a mostrar: buscar por displayTurnId, si no hay, intentar buscar en schedules activo
  const displayTurnName = (() => {
    // DEBUG: inspeccionar por qué no se encuentra la jornada
    try {
      console.debug('EmployeeRow debug:', { empId: emp.id, displayTurnId, openIn: openIn ? { id: openIn.id, turnId: openIn.turnId } : null })
    } catch (e) {}
    if (displayTurnId) {
      const t = turns.find(tt => String(tt.id) === String(displayTurnId))
      try { console.debug('Found turn by displayTurnId', { found: !!t, turn: t }) } catch(e) {}
      if (t) return t.name
    }
    // fallback: buscar schedule activo para este empleado
    const nowStr = timeNowStr(nowTick)
    const s = schedules && schedules.find(sc => String(sc.employeeId) === String(emp.id) && isScheduleActive(sc, turns, nowStr, todayStr))
    try { console.debug('Found schedule for emp', { empId: emp.id, schedule: s }) } catch(e) {}
    if (s) {
      // si schedule trae turnId, preferirlo
      if (s.turnId) {
        const t2 = turns.find(tt => String(tt.id) === String(s.turnId))
        try { console.debug('Found turn by schedule.turnId', { found: !!t2, turn: t2 }) } catch(e) {}
        if (t2) return t2.name
      }
      // si schedule no tiene turnId, intentar fallback a turnAssignments (quick mapping)
      try {
        const ta = typeof api.getTurnAssignments === 'function' ? api.getTurnAssignments().find(x => String(x.employeeId) === String(emp.id)) : null
        if (ta && ta.turnId) {
          const t3 = turns.find(tt => String(tt.id) === String(ta.turnId))
          try { console.debug('Found turn by turnAssignment', { found: !!t3, turn: t3, turnAssignment: ta }) } catch(e) {}
          if (t3) return t3.name
        }
      } catch(e) {}
    }
    return '—'
  })()

  // debug visible en UI para diagnosticar por qué no se encuentra la jornada
  // debug (removed visible output)

  return (
    <tr className={statusClass}>
      <td className="px-3 py-3 align-top">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {disableMarkForAbsent ? (
              <div className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 bg-slate-100">Ausente</div>
            ) : (
              <button
                onClick={() => {
                  if (closedEarlier) return
                  if (!openIn && hasStartedToday) return
                  if (openIn) {
                    requestConfirm(`Confirmar cierre de turno de ${emp.name}? Se registrará la hora de salida.`, () => onAddKey(emp.id, 'SALIDA', 'shift_out'))
                  } else {
                    setMarkedRows(prev => Array.from(new Set([...(prev || []), emp.id])))
                    onAddKey(emp.id, 'ENTRADA', 'shift_in')
                  }
                }}
                disabled={closedEarlier || (!openIn && hasStartedToday)}
                className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${closedEarlier ? 'bg-red-400 opacity-80 cursor-not-allowed' : openIn ? 'bg-blue-600' : !openIn && hasStartedToday ? 'bg-gray-400 opacity-60 cursor-not-allowed' : 'bg-blue-600'}`}
              >
                {closedEarlier ? 'Turno cerrado' : openIn ? 'Cerrar' : hasStartedToday ? 'Inicio marcado' : 'Marcar'}
              </button>
            )}
            <div className="text-xs text-slate-600">{emp.name}</div>
          </div>
        </div>
      </td>


      <td className="px-3 py-3 align-top">
        <div className="text-sm font-medium">{emp.name}</div>
      </td>

      <td className="px-3 py-3 align-top">
        <div className="text-[12px] text-slate-500">{emp.position || '—'}</div>
      </td>

      <td className="px-3 py-3 align-top">
        <div className="text-sm text-slate-700">{displayTurnName}</div>
      </td>

      <td className="px-3 py-3 align-top">
        <div className="space-y-2">
          <div className="rounded-md overflow-hidden border border-slate-300 bg-slate-200">
            <div className="bg-cyan-900 px-3 py-1 text-[11px] font-semibold text-white">Almuerzo / Cena</div>
            <div className="flex items-center justify-center py-6">
              <button
                onClick={() => {
                  if (!enabled) return
                  if (openBreakAlm) onCloseKey(openBreakAlm.id)
                  else onAddKey(emp.id, 'Almuerzo/Cena', 'break_start', { breakType: 'almuerzo_cena', duration: breakDefaults.almuerzo })
                }}
                disabled={!enabled}
                className={`rounded-full ${!enabled ? 'bg-gray-400 opacity-60 cursor-not-allowed' : 'bg-cyan-900 hover:bg-cyan-800'} px-4 py-2 text-xs font-semibold text-white shadow-sm transition`}
              >
                {openBreakAlm ? 'Terminar' : 'Comienza tiempo'}
              </button>
            </div>
          </div>

          <div className="rounded-md overflow-hidden border border-slate-300 bg-slate-200">
            <div className="bg-cyan-900 px-3 py-1 text-[11px] font-semibold text-white">Desayuno / Café</div>
            <div className="flex items-center justify-center py-6">
              <button
                onClick={() => {
                  if (!enabled) return
                  if (openBreakDes) onCloseKey(openBreakDes.id)
                  else onAddKey(emp.id, 'Desayuno/Café', 'break_start', { breakType: 'desayuno_cafe', duration: breakDefaults.desayuno })
                }
                }
                disabled={!enabled}
                className={`rounded-full ${!enabled ? 'bg-gray-400 opacity-60 cursor-not-allowed' : 'bg-cyan-900 hover:bg-cyan-800'} px-4 py-2 text-xs font-semibold text-white shadow-sm transition`}
              >
                {openBreakDes ? 'Terminar' : 'Comienza tiempo'}
              </button>
            </div>
          </div>
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {keys
              .filter(k => String(k.employeeId) === String(emp.id) && !k.closedAt)
              .map(k => (
                <div key={k.id} className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1 text-[11px] shadow-sm">
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold">{k.clave}</span>
                    {k.type === 'break_start' && k.meta?.breakType && (
                      <span className="text-[10px] text-slate-300">{k.meta.breakType}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-200">{new Date(k.createdAt).toLocaleTimeString()}</span>
                  {k.type === 'break_start' && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-100">{Math.floor((nowTick - new Date(k.createdAt)) / 1000)}s</span>
                  )}
                  {(!enabled) ? (
                    <button disabled className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] opacity-50 cursor-not-allowed">Cerrar</button>
                  ) : (
                    <button onClick={() => {
                      if (k.type === 'shift_in') {
                        requestConfirm(`Confirmar cierre de turno de ${emp.name}? Se registrará la hora de salida.`, () => onCloseKey(k.id))
                        return
                      }
                      onCloseKey(k.id)
                    }} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] hover:bg-white/20 transition">Cerrar</button>
                  )}
                </div>
              ))}
          </div>

          <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2 max-h-40 overflow-y-auto">
            {keys
              .filter(k => String(k.employeeId) === String(emp.id))
              .slice(-5)
              .reverse()
              .map(h => {
                const start = new Date(h.createdAt)
                const end = h.closedAt ? new Date(h.closedAt) : null
                const durationMs = end ? end - start : 0
                const durationMin = end ? Math.round(durationMs / 60000) : null
                const durationStr = end ? (durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin}m`) : null

                return (
                  <div key={h.id} className="flex justify-between gap-3 border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">{h.clave}</span>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">{h.type || 'clave'}</div>
                    </div>
                    <div className="text-[10px] text-right text-slate-500 space-y-0.5">
                      <div><span className="font-semibold text-slate-400">Inicio:{' '}</span>{start.toLocaleString()}</div>
                      {end ? (<div><span className="font-semibold text-slate-400">Fin:{' '}</span>{end.toLocaleString()} <span className="ml-1 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-semibold text-slate-700">{durationStr}</span></div>) : (<div className="flex items-center justify-end gap-1 text-amber-600"><span className="font-semibold text-[10px]">Abierto</span><span>• {start.toLocaleTimeString()}</span></div>)}
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
  const [positions, setPositions] = useState([])
  const [assignments, setAssignments] = useState([])
  const [activeEmployees, setActiveEmployees] = useState([])
  const [markedRows, setMarkedRows] = useState([])
  const [nowTick, setNowTick] = useState(Date.now())
  const [breakDefaults] = useState({ desayuno: 15, cafe: 10, almuerzo: 60, cena: 45 })

  const [search, setSearch] = useState('')
  const [onlyWithOpenKeys, setOnlyWithOpenKeys] = useState(false)
  // confirm modal state
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null })

  function requestConfirm(message, onConfirm) {
    setConfirmState({ open: true, message: String(message || ''), onConfirm: typeof onConfirm === 'function' ? onConfirm : null })
  }

  function closeConfirm(commit = false) {
    const cb = confirmState.onConfirm
    setConfirmState({ open: false, message: '', onConfirm: null })
    if (commit && cb) cb()
  }

  function refreshAll() {
    const ks = api.getKeys()
    const es = api.getEmployees()
    const ts = api.getTurns()
    const ss = api.getSchedules()
    const ps = api.getPositions ? api.getPositions() : []
    const as = api.getAssignments ? api.getAssignments() : []

    setKeys(ks)
    setTurns(ts)
    setSchedules(ss)
    setPositions(ps)
    setAssignments(as)

    // enriquecer empleados con su puesto (si aplica)
    const enriched = es.map(e => {
      const assign = as.find(a => String(a.employeeId) === String(e.id))
      const pos = assign && ps.find(p => String(p.id) === String(assign.positionId))
      return { ...e, position: pos ? pos.name : undefined }
    })
    setEmployees(enriched)

    const now = new Date()
    const nowStr = timeNowStr(now.getTime())
    const today = toLocalYYYYMMDD(now.getTime())

    // empleados según su schedule activo, pero excluir quienes ya tuvieron ausencia hoy
    let active = enriched.filter(emp => {
      const schActive = ss.some(s => String(s.employeeId) === String(emp.id) && isScheduleActive(s, ts, nowStr, today))
      const hasAbsentToday = ks.some(k => String(k.employeeId) === String(emp.id) && k.type === 'absent' && new Date(k.createdAt).toISOString().slice(0,10) === today)
      return schActive && !hasAbsentToday
    })

    // Crear automáticamente una clave 'absent' (cerrada) para empleados que ya sean considerados ausentes
    // y que no tengan registro de inicio ni de ausencia hoy. Evita duplicados por día.
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const absentThreshold = 15 // minutos para considerar ausencia
    const lateThreshold = 5 // minutos para considerar tardanza

    for (const emp of active) {
      const hasStartToday = ks.some(k => String(k.employeeId) === String(emp.id) && k.type === 'shift_in' && toLocalYYYYMMDD(k.createdAt) === today)
      const hasAbsentToday = ks.some(k => String(k.employeeId) === String(emp.id) && k.type === 'absent' && toLocalYYYYMMDD(k.createdAt) === today)
      if (hasStartToday || hasAbsentToday) continue

      // intentar determinar turno activo para este empleado desde sus schedules
      const sch = ss.find(s => String(s.employeeId) === String(emp.id) && isScheduleActive(s, ts, nowStr, today))
      const turn = sch ? ts.find(t => String(t.id) === String(sch.turnId)) : null
      if (!turn || !turn.startTime) continue

      const parseHHMM = (s) => {
        if (!s) return null
        const [hh, mm] = s.split(':').map(x => parseInt(x || '0', 10))
        return hh * 60 + mm
      }
      const startMin = parseHHMM(turn.startTime)
      if (startMin == null) continue

      // Crear clave automática de tardanza si pasó el umbral de tardanza y aún no marcó
      const hasLateToday = ks.some(k => String(k.employeeId) === String(emp.id) && k.type === 'late' && toLocalYYYYMMDD(k.createdAt) === today)
      if (!hasLateToday && nowMinutes >= startMin + lateThreshold && nowMinutes < startMin + absentThreshold) {
        try {
          const k = api.addKey({ employeeId: emp.id, turnId: turn.id, clave: 'TARDANZA', type: 'late' })
          try { api.updateKey(k.id, { closedAt: new Date().toISOString() }) } catch(e) {}
        } catch (e) {}
      }

      // Mostrar ausencia si ahora pasó el umbral de ausencia respecto al inicio del turno
      if (nowMinutes >= startMin + absentThreshold) {
        try {
          const k = api.addKey({ employeeId: emp.id, turnId: turn.id, clave: 'AUSENTE', type: 'absent' })
          try { api.updateKey(k.id, { closedAt: new Date().toISOString() }) } catch(e) {}
        } catch (e) {}
      }
    }

    // añadir empleados que tengan un shift_in abierto (no cerrados) aunque el schedule ya haya terminado
    const employeesWithOpenShiftIds = new Set(api.getKeys().filter(k => k.type === 'shift_in' && !k.closedAt).map(k => String(k.employeeId)))
    for (const emp of enriched) {
      if (employeesWithOpenShiftIds.has(String(emp.id)) && !active.find(a => String(a.id) === String(emp.id))) {
        active.push(emp)
      }
    }

    // refrescar keys en memoria por si se crearon ausencias y recalcular active para excluir nuevas ausencias
    const refreshedKeys = api.getKeys()
    setKeys(refreshedKeys)
    active = enriched.filter(emp => {
      const schActive = ss.some(s => String(s.employeeId) === String(emp.id) && isScheduleActive(s, ts, nowStr, today))
      const hasAbsentToday = refreshedKeys.some(k => String(k.employeeId) === String(emp.id) && k.type === 'absent' && toLocalYYYYMMDD(k.createdAt) === today)
      return (schActive || employeesWithOpenShiftIds.has(String(emp.id))) && !hasAbsentToday
    })
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
    const nowStr = timeNowStr(nowTick)
    const today = toLocalYYYYMMDD(nowTick)
    // normalizar comparaciones de IDs para evitar fallos por number/string
    const s = schedules.find(sc => String(sc.employeeId) === String(emp.id) && isScheduleActive(sc, turns, nowStr, today))
    return s?.turnId || ''
  }

  function addKey(employeeId, clave, type = 'clave', meta = {}) {
    const emp = employees.find(e => e.id === employeeId)
    const defaultTurn = defaultTurnForEmployee(emp)

    // special-case: create an absent clave and close it immediately
    if (type === 'absent') {
      const k = api.addKey({ employeeId, turnId: defaultTurn, clave, type, meta })
      try {
        api.updateKey(k.id, { closedAt: new Date().toISOString() })
      } catch (e) {}
      refreshAll()
      return
    }

    if (type === 'break_start' && meta?.breakType) {
      const ks = api.getKeys()
      const open = ks.filter(k => k.employeeId === employeeId && k.type === 'break_start' && !k.closedAt && k.meta?.breakType === meta.breakType).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))[0]
      if (open) {
        api.updateKey(open.id, { closedAt: new Date().toISOString() })
        refreshAll()
        return
      }
    }

    if (type === 'shift_out') {
      const ks = api.getKeys()
      const lastIn = ks.filter(k => k.employeeId === employeeId && k.type === 'shift_in' && !k.closedAt).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0]
      if (lastIn) {
        api.updateKey(lastIn.id, { closedAt: new Date().toISOString() })
        refreshAll()
        // remove any UI mark for this employee when closing shift
        setMarkedRows(prev => prev.filter(x => x !== employeeId))
        return
      }
      api.addKey({ employeeId, turnId: defaultTurn, clave, type, meta })
      refreshAll()
      setMarkedRows(prev => prev.filter(x => x !== employeeId))
      return
    }

    const k = api.addKey({ employeeId, turnId: defaultTurn, clave, type, meta })
    refreshAll()
    // if starting a shift, mark the row so other buttons/inputs are enabled
    if (type === 'shift_in') setMarkedRows(prev => Array.from(new Set([...prev, employeeId])))
  }

  function closeKey(id) {
    const k = keys.find(x => x.id === id)
    api.closeKey(id)
    refreshAll()
    if (k && k.employeeId) setMarkedRows(prev => prev.filter(x => x !== k.employeeId))
  }

  const openKeysCount = keys.filter(k => !k.closedAt && activeEmployees.some(emp => emp.id === k.employeeId)).length

  const currentTime = new Date(nowTick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const normalizedSearch = search.trim().toLowerCase()
  const filteredEmployees = activeEmployees.filter(emp => {
    const matchesSearch = !normalizedSearch || emp.name.toLowerCase().includes(normalizedSearch) || (emp.position || '').toLowerCase().includes(normalizedSearch)
    if (!matchesSearch) return false
    if (!onlyWithOpenKeys) return true
    return keys.some(k => k.employeeId === emp.id && !k.closedAt)
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Marcas de Empleados - tiempo real</h2>
          <p className="text-sm text-slate-500">Control de entradas, salidas y descansos por persona empleada.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="font-semibold text-slate-700">{activeEmployees.length} en servicio</span></div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1"><span className="h-2 w-2 rounded-full bg-blue-500" /><span className="font-semibold text-slate-700">{openKeysCount} claves abiertas</span></div>
          <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-mono text-slate-100">{currentTime}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex-1 min-w-[260px]"><input type="text" placeholder="Buscar empleado o puesto..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800"/></div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={onlyWithOpenKeys} onChange={e=>setOnlyWithOpenKeys(e.target.checked)} />
          <span>Mostrar solo quienes tienen claves abiertas</span>
        </label>
      </div>

      <div className="mt-2 rounded-xl border border-slate-100 bg-white">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full table-auto border-collapse text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 text-left font-semibold">Acción</th>
                <th className="px-3 py-2 text-left font-semibold">Empleado</th>
                <th className="px-3 py-2 text-left font-semibold">Puesto</th>
                <th className="px-3 py-2 text-left font-semibold">Jornada</th>
                <th className="px-3 py-2 text-left font-semibold">Descansos rápidos</th>
                <th className="px-3 py-2 text-left font-semibold">Historial de Marcas</th>
              </tr>
            </thead>
            
            <tbody>
              {filteredEmployees.length === 0 && (<tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">No hay coincidencias con la búsqueda o no hay personas en servicio.</td></tr>)}
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
                  requestConfirm={requestConfirm}
                  markedRows={markedRows}
                  setMarkedRows={setMarkedRows}
                  schedules={schedules}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Confirm modal (rendered via portal to document.body to ensure full-viewport backdrop) */}
      <ConfirmModal open={confirmState.open} message={confirmState.message} onCancel={() => closeConfirm(false)} onConfirm={() => closeConfirm(true)} />
    </div>
  )
}

function ConfirmModal({ open, message, onCancel, onConfirm }) {
  if (!open) return null
  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-[min(560px,92%)] rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold">Confirmar acción</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-md px-3 py-1 bg-gray-100">Cancelar</button>
          <button onClick={onConfirm} className="rounded-md px-3 py-1 bg-blue-600 text-white">Confirmar</button>
        </div>
      </div>
    </div>
  )
  return createPortal(modal, document.body)
}
