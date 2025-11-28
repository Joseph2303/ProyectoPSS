import React, { useEffect, useState } from 'react'
import { api } from '../api/mockApi'
import { toast } from 'react-hot-toast'

export default function PositionsPage(){
  const [positions, setPositions] = useState([])
  const [employees, setEmployees] = useState([])
  const [assignments, setAssignments] = useState([])
  const [editing, setEditing] = useState(null)
  const [posForm, setPosForm] = useState({ name: '' })
  const [assignForm, setAssignForm] = useState({ employeeId: '', positionId: '', code: '' })
  const [employeeAssignSearch, setEmployeeAssignSearch] = useState('')
  const [positionAssignSearch, setPositionAssignSearch] = useState('')
  const [employeeAssignOpen, setEmployeeAssignOpen] = useState(false)
  const [positionAssignOpen, setPositionAssignOpen] = useState(false)

  useEffect(()=>{ refresh() }, [])

  function refresh(){
    setPositions(api.getPositions())
    setEmployees(api.getEmployees())
    setAssignments(api.getAssignments())
  }

  function savePosition(e){
    e.preventDefault()
    const name = (posForm.name||'').trim()
    if(!name){ toast.error('Nombre del puesto requerido'); return }
    if(editing){ api.updatePosition(editing.id, { name }); toast.success('Puesto actualizado') ; setEditing(null) }
    else { api.addPosition({ name }); toast.success('Puesto creado') }
    setPosForm({ name: '' })
    refresh()
  }

  function editPosition(p){ setEditing(p); setPosForm({ name: p.name }) }
  function delPosition(id){ if(!confirm('Eliminar puesto?')) return; api.deletePosition(id); toast.success('Puesto eliminado'); refresh() }

  function saveAssign(e){
    e.preventDefault()
    const { employeeId, positionId, code } = assignForm
    if(!employeeId || !positionId){ toast.error('Seleccione empleado y puesto'); return }
    api.assignEmployee(employeeId, positionId, code || '')
    toast.success('Asignación guardada')
    setAssignForm({ employeeId: '', positionId: '', code: '' })
    refresh()
  }

  function unassign(empId){ if(!confirm('Quitar asignación?')) return; api.unassignEmployee(empId); toast('Asignación removida'); refresh() }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Gestión de puestos</h2>
        <p className="text-sm text-slate-500">Crea y administra puestos. Asigna empleados a puestos con un código.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-semibold mb-3">Puestos</h3>
          <form onSubmit={savePosition} className="flex gap-2">
            <input value={posForm.name} onChange={e=>setPosForm({ name: e.target.value })} placeholder="Nombre del puesto" className="flex-1 rounded-full border px-3 py-2 text-sm" />
            <button className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm">{editing? 'Actualizar' : 'Crear'}</button>
          </form>

          <div className="mt-4 overflow-hidden rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left">Puesto</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center text-xs text-slate-400 py-4">No hay puestos creados</td>
                  </tr>
                )}

                {positions.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => editPosition(p)} className="text-xs px-2 py-1 rounded-full bg-slate-100">Editar</button>
                        <button onClick={() => delPosition(p.id)} className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-semibold mb-3">Asignaciones</h3>
          <form onSubmit={saveAssign} className="grid grid-cols-1 gap-2">
            {/* Combo buscable: Empleado (solo activos) */}
            {(() => {
              const activeEmployees = employees.filter(e => e.active !== false)
              const selected = activeEmployees.find(e => e.id === assignForm.employeeId)
              const display = emp => emp?.name || emp?.id
              const inputValue = employeeAssignSearch !== '' ? employeeAssignSearch : (selected ? display(selected) : '')
              const filtered = activeEmployees.filter(emp => (employeeAssignSearch || '').trim() === '' ? true : display(emp).toLowerCase().includes(employeeAssignSearch.trim().toLowerCase()))

              return (
                <div className="relative">
                  <input
                    value={inputValue}
                    onChange={e => { setEmployeeAssignSearch(e.target.value); setAssignForm(f=>({ ...f, employeeId: '' })); setEmployeeAssignOpen(true) }}
                    onFocus={() => setEmployeeAssignOpen(true)}
                    onBlur={() => setTimeout(() => setEmployeeAssignOpen(false), 150)}
                    placeholder="Buscar o seleccionar empleado..."
                    className="w-full rounded-full border px-3 py-2 text-sm"
                  />
                  {inputValue && <button type="button" onClick={() => { setEmployeeAssignSearch(''); setAssignForm(f=>({ ...f, employeeId: '' })); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">✕</button>}

                  {employeeAssignOpen && (
                    <div className="absolute z-20 mt-2 w-full max-h-44 overflow-auto rounded-md border bg-white shadow-lg">
                      {filtered.length === 0 ? (
                        <div className="p-2 text-xs text-slate-400">No hay coincidencias</div>
                      ) : (
                        filtered.map(ep => (
                          <div key={ep.id} onMouseDown={() => { setAssignForm(f=>({ ...f, employeeId: ep.id })); setEmployeeAssignSearch(''); setEmployeeAssignOpen(false) }} className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer">{display(ep)}</div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Combo buscable: Puesto */}
            {(() => {
              const selected = positions.find(p => p.id === assignForm.positionId)
              const display = p => p?.name || p?.id
              const inputValue = positionAssignSearch !== '' ? positionAssignSearch : (selected ? display(selected) : '')
              const filtered = positions.filter(p => (positionAssignSearch || '').trim() === '' ? true : display(p).toLowerCase().includes(positionAssignSearch.trim().toLowerCase()))

              return (
                <div className="relative">
                  <input
                    value={inputValue}
                    onChange={e => { setPositionAssignSearch(e.target.value); setAssignForm(f=>({ ...f, positionId: '' })); setPositionAssignOpen(true) }}
                    onFocus={() => setPositionAssignOpen(true)}
                    onBlur={() => setTimeout(() => setPositionAssignOpen(false), 150)}
                    placeholder="Buscar o seleccionar puesto..."
                    className="w-full rounded-full border px-3 py-2 text-sm"
                  />
                  {inputValue && <button type="button" onClick={() => { setPositionAssignSearch(''); setAssignForm(f=>({ ...f, positionId: '' })); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">✕</button>}

                  {positionAssignOpen && (
                    <div className="absolute z-20 mt-2 w-full max-h-44 overflow-auto rounded-md border bg-white shadow-lg">
                      {filtered.length === 0 ? (
                        <div className="p-2 text-xs text-slate-400">No hay coincidencias</div>
                      ) : (
                        filtered.map(p => (
                          <div key={p.id} onMouseDown={() => { setAssignForm(f=>({ ...f, positionId: p.id })); setPositionAssignSearch(''); setPositionAssignOpen(false) }} className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer">{display(p)}</div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
            <input value={assignForm.code} onChange={e=>setAssignForm(f=>({ ...f, code: e.target.value }))} placeholder="Código (ej. OP-001)" className="rounded-full border px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm">Asignar</button>
              <button type="button" onClick={()=>setAssignForm({ employeeId:'', positionId:'', code:'' })} className="rounded-full border px-4 py-2 text-sm">Limpiar</button>
            </div>
          </form>

          <div className="mt-4 overflow-hidden rounded-md border">
            <h4 className="sr-only">Asignaciones actuales</h4>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left">Empleado</th>
                  <th className="px-4 py-2 text-left">Puesto</th>
                  <th className="px-4 py-2 text-left">Código</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const activeIds = new Set(employees.filter(e => e.active !== false).map(e => e.id))
                  const visibleAssignments = assignments.filter(a => activeIds.has(a.employeeId))
                  if (visibleAssignments.length === 0) return (
                    <tr>
                      <td colSpan={4} className="text-center text-xs text-slate-400 py-4">Sin asignaciones</td>
                    </tr>
                  )

                  return visibleAssignments.map(a => {
                    const emp = employees.find(e => e.id === a.employeeId)
                    const pos = positions.find(p => p.id === a.positionId)
                    return (
                      <tr key={a.employeeId} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-2">{emp?.name || a.employeeId}</td>
                        <td className="px-4 py-2">{pos?.name || '—'}</td>
                        <td className="px-4 py-2"><span className="text-xs text-slate-500">{a.code || '—'}</span></td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button onClick={() => { setAssignForm({ employeeId: a.employeeId, positionId: a.positionId, code: a.code }) }} className="text-xs px-2 py-1 rounded-full bg-slate-100">Editar</button>
                            <button onClick={() => unassign(a.employeeId)} className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Quitar</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
