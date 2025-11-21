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
  keys: [
    { id: 'k1', clave: 'A123', employeeId: 'e1', turnId: 't1', createdAt: new Date().toISOString(), closedAt: null }
  ]
}

function load(){
  const raw = localStorage.getItem(LOCAL_KEY)
  if(!raw){
    // Al primer inicio, poblar con datos de ejemplo para acelerar pruebas
    localStorage.setItem(LOCAL_KEY, JSON.stringify(SAMPLE))
    return JSON.parse(JSON.stringify(SAMPLE))
  }
  return JSON.parse(raw)
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
  addKey(k){ const s=load(); k.id=uid(); k.createdAt = new Date().toISOString(); s.keys.push(k); save(s); return k },
  closeKey(id){ const s=load(); const i=s.keys.findIndex(k=>k.id===id); if(i===-1) return null; s.keys[i].closedAt = new Date().toISOString(); save(s); return s.keys[i] },
  updateKey(id, patch){ const s=load(); const i=s.keys.findIndex(k=>k.id===id); if(i===-1) return null; s.keys[i] = {...s.keys[i], ...patch}; save(s); return s.keys[i] }
}
