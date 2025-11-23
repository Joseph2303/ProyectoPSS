const LOCAL_KEY = 'ci_frontend_store_v1'

const SAMPLE = {
  employees: [
    { id: 'e1', name: 'Juan Pérez', position: 'Operativo', code: 'OP-001' },
    { id: 'e2', name: 'María García', position: 'Operativo', code: 'OP-002' },
    { id: 'e3', name: 'Luis Torres', position: 'Supervisor', code: 'SP-001' }
  ],
  turns: [
    { id: 't1', name: 'Matutino', startTime: '06:00', endTime: '14:00' },
    { id: 't2', name: 'Vespertino', startTime: '14:00', endTime: '22:00' },
    { id: 't3', name: 'Nocturno', startTime: '22:00', endTime: '06:00' }
  ],
  schedules: [
    { id: 's1', employeeId: 'e1', turnId: 't1', days: ['Lun','Mar','Mié','Jue','Vie'], freeDay: 'Dom', startDate: '2025-11-01', endDate: '2025-11-30' },
    { id: 's2', employeeId: 'e1', turnId: 't2', days: ['Sáb','Dom'], freeDay: 'Mié', startDate: '2025-12-01', endDate: '2025-12-31' },
    { id: 's3', employeeId: 'e2', turnId: 't2', days: ['Lun','Mar','Mié','Jue','Vie'], freeDay: 'Sáb', startDate: '2025-11-01', endDate: '2025-11-30' }
  ],
  keys: [],
  reports: []
}

function load(){
  const raw = localStorage.getItem(LOCAL_KEY)
  if(!raw){
    // Al primer inicio, poblar con datos de ejemplo para acelerar pruebas
    localStorage.setItem(LOCAL_KEY, JSON.stringify(SAMPLE))
    return JSON.parse(JSON.stringify(SAMPLE))
  }
  const s = JSON.parse(raw)
  // garantizar campo reports
  if (!s.reports) s.reports = []
  return s
}

function save(state){
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
}

function uid(){
  return Math.random().toString(36).slice(2,9)
}

export const api = {
  // Administración de almacenamiento
  exportState(){ return JSON.stringify(load(), null, 2) },
  resetStore(){ localStorage.removeItem(LOCAL_KEY); return true },
  seedSampleData(){ localStorage.setItem(LOCAL_KEY, JSON.stringify(SAMPLE)); return true },

  // Employees
  getEmployees(){ return load().employees },
  addEmployee(emp){ const s=load(); emp.id = uid(); s.employees.push(emp); save(s); return emp },
  updateEmployee(id, patch){ const s=load(); const i=s.employees.findIndex(e=>e.id===id); if(i===-1) return null; s.employees[i]={...s.employees[i],...patch}; save(s); return s.employees[i] },
  deleteEmployee(id){ const s=load(); s.employees = s.employees.filter(e=>e.id!==id); save(s); return true },

  // Turns
  getTurns(){ return load().turns },
  addTurn(t){ const s=load(); t.id=uid(); s.turns.push(t); save(s); return t },
  updateTurn(id, patch){ const s=load(); const i=s.turns.findIndex(t=>t.id===id); if(i===-1) return null; s.turns[i]={...s.turns[i],...patch}; save(s); return s.turns[i] },
  deleteTurn(id){ const s=load(); s.turns=s.turns.filter(t=>t.id!==id); save(s); return true },

  // Schedules
  getSchedules(){ return load().schedules },
  addSchedule(sch){ const s=load(); sch.id=uid(); s.schedules.push(sch); save(s); return sch },
  updateSchedule(id, patch){ const s=load(); const i=s.schedules.findIndex(x=>x.id===id); if(i===-1) return null; s.schedules[i]={...s.schedules[i],...patch}; save(s); return s.schedules[i] },
  deleteSchedule(id){ const s=load(); s.schedules = s.schedules.filter(x=>x.id!==id); save(s); return true },

  // Keys (claves)
  getKeys(){ return load().keys },
  addKey(k){ const s=load(); k.id=uid(); k.createdAt = new Date().toISOString(); s.keys.push(k);
    // Nota: no crear un reporte por cada clave (evitar reportes por evento)
    save(s); return k },
  closeKey(id){ const s=load(); const i=s.keys.findIndex(k=>k.id===id); if(i===-1) return null; s.keys[i].closedAt = new Date().toISOString();
    const k = s.keys[i]
    // Generar snapshot/reporte según el tipo cerrado
    if (k.type === 'shift_in') {
      try { createShiftReport(s, k) } catch (e) {}
      try { createRowSnapshot(s, k.employeeId) } catch(e) {}
    } else if (k.type === 'absent' || k.type === 'late') {
      // si se cierra una ausencia o una tardanza, generar snapshot para que aparezca en reportes
      try { createRowSnapshot(s, k.employeeId) } catch(e) {}
    }
    save(s); return s.keys[i] },
  updateKey(id, patch){ const s=load(); const i=s.keys.findIndex(k=>k.id===id); if(i===-1) return null; s.keys[i] = {...s.keys[i], ...patch};
    const k = s.keys[i]
    // Si la actualización contiene cierre, generar reportes/snapshots según el tipo
    if (patch && patch.closedAt) {
      if (s.keys[i].type === 'shift_in') {
        try { createShiftReport(s, s.keys[i]) } catch(e) {}
        try { createRowSnapshot(s, s.keys[i].employeeId) } catch(e) {}
      } else if (s.keys[i].type === 'absent' || s.keys[i].type === 'late') {
        try { createRowSnapshot(s, s.keys[i].employeeId) } catch(e) {}
      }
    }
    save(s); return s.keys[i] },
  // Reports
  getReports(){ return load().reports },
  updateReport(id, patch){ const s=load(); const i=s.reports.findIndex(r=>r.id===id); if(i===-1) return null; s.reports[i] = {...s.reports[i], ...patch}; save(s); return s.reports[i] },
  clearReports(){ const s=load(); s.reports = []; save(s); return true }
}

// helper: create a detailed shift report when a shift_in is closed
function createShiftReport(state, shiftKey) {
  // state: already-loaded store object; shiftKey: the closed shift_in key object (with closedAt)
  if (!shiftKey || !shiftKey.closedAt) return
  const start = new Date(shiftKey.createdAt)
  const end = new Date(shiftKey.closedAt)
  const durationMin = Math.round((end - start) / 60000)

  // collect all keys for this employee within the session interval (inclusive)
  const items = state.keys
    .filter(k => k.employeeId === shiftKey.employeeId)
    .filter(k => {
      const t = new Date(k.createdAt)
      return t >= start && t <= end
    })
    .map(k => ({ id: k.id, clave: k.clave, type: k.type, createdAt: k.createdAt, closedAt: k.closedAt || null, meta: k.meta || null }))

  // summarize breaks
  const breaks = items
    .filter(x => x.type === 'break_start')
    .map(b => ({
      id: b.id,
      breakType: b.meta?.breakType || null,
      start: b.createdAt,
      end: b.closedAt || null,
      durationMin: b.closedAt ? Math.round((new Date(b.closedAt) - new Date(b.createdAt)) / 60000) : null
    }))

  const emp = state.employees.find(e => e.id === shiftKey.employeeId) || null
  const turn = state.turns.find(t => t.id === shiftKey.turnId) || null

  const report = {
    id: uid(),
    type: 'shift_report',
    keyId: shiftKey.id,
    employeeId: shiftKey.employeeId,
    employee: emp ? { id: emp.id, name: emp.name, position: emp.position, code: emp.code } : null,
    turnId: shiftKey.turnId || null,
    turn: turn ? { id: turn.id, name: turn.name, startTime: turn.startTime, endTime: turn.endTime } : null,
    start: shiftKey.createdAt,
    end: shiftKey.closedAt,
    durationMin,
    items,
    breaks,
    timestamp: new Date().toISOString()
  }

  // Mantener solo un reporte por empleado: eliminar previos y añadir el nuevo
  state.reports = state.reports.filter(r => r.employeeId !== shiftKey.employeeId)
  state.reports.push(report)
}

// helper: create a snapshot of the KeysPage row for an employee
function createRowSnapshot(state, employeeId) {
  const emp = state.employees.find(e => e.id === employeeId) || null
  // determine a turnId: prefer last key's turnId, fallback null
  const lastKey = state.keys.slice().reverse().find(k => k.employeeId === employeeId && k.turnId)
  const turn = lastKey ? state.turns.find(t => t.id === lastKey.turnId) : null

  const keysForEmp = state.keys
    .filter(k => k.employeeId === employeeId)
    .sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt))
    .map(k => ({ id: k.id, clave: k.clave, type: k.type, createdAt: k.createdAt, closedAt: k.closedAt || null, meta: k.meta || null }))

  const snapshot = {
    id: uid(),
    type: 'row_snapshot',
    employeeId: employeeId,
    employee: emp ? { id: emp.id, name: emp.name, position: emp.position, code: emp.code } : null,
    turnId: lastKey ? lastKey.turnId : null,
    turn: turn ? { id: turn.id, name: turn.name, startTime: turn.startTime, endTime: turn.endTime } : null,
    keys: keysForEmp,
    timestamp: new Date().toISOString()
  }

  // Mantener solo un reporte por empleado: eliminar previos y añadir el nuevo
  state.reports = state.reports.filter(r => r.employeeId !== employeeId)
  state.reports.push(snapshot)
}
