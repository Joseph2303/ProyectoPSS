import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api/mockApi'
import { toast } from 'react-hot-toast'
import Pagination from '../components/Pagination'

/* FORMULARIO DE TURNOS */
function TurnForm({ onSave, initial, onCancelEdit }) {
  const empty = { name: '', startTime: '', endTime: '' }

  const [form, setForm] = useState(initial || empty)

  useEffect(() => {
    setForm(initial || empty)
  }, [initial])

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form, () => setForm(empty))
  }

  function handleReset() {
    setForm(empty)
    onCancelEdit && onCancelEdit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200"
    >
      <input
        placeholder="Nombre del turno (Ej: Matutino)"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="time"
        value={form.startTime}
        onChange={e => setForm({ ...form, startTime: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="time"
        value={form.endTime}
        onChange={e => setForm({ ...form, endTime: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          {initial ? 'Actualizar' : 'Guardar'}
        </button>
        {initial && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

/* LISTA DE TURNOS */
export default function TurnsPage() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [employees, setEmployees] = useState([])
  const [turnAssignments, setTurnAssignments] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedTurnId, setSelectedTurnId] = useState('')
  const [assignFilterTurn, setAssignFilterTurn] = useState('')
  const [assignSortBy, setAssignSortBy] = useState('employee')
  const [assignSortDir, setAssignSortDir] = useState('asc')
  const [assignPage, setAssignPage] = useState(1)
  const [assignPageSize, setAssignPageSize] = useState(6)
  const [editingAssignment, setEditingAssignment] = useState(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [turnSearch, setTurnSearch] = useState('')

  // estado para el modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [turnToDelete, setTurnToDelete] = useState(null)

  useEffect(() => {
    try {
      setItems(api.getTurns())
      setEmployees(api.getEmployees())
      setTurnAssignments(api.getTurnAssignments())
    } catch (err) {
      console.error(err)
      toast.error('Error cargando los turnos')
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, items])

  function refresh() {
    try {
      setItems(api.getTurns())
      setEmployees(api.getEmployees())
      setTurnAssignments(api.getTurnAssignments())
    } catch (err) {
      console.error(err)
      toast.error('No se pudieron refrescar los turnos')
    }
  }

  function handleQuickAssign(e) {
    e.preventDefault()
    // Si estamos editando una asignación en modal, no procesar el formulario rápido
    if (editingAssignment) {
      toast('Cierre la edición antes de asignar otra jornada', { icon: 'ℹ️' })
      return
    }
    if (!selectedEmployee) { toast.error('Seleccione un empleado'); return }
    if (!selectedTurnId) { toast.error('Seleccione una jornada'); return }

    // avoid duplicate assignment (same employee)
    const existing = api.getTurnAssignments().find(a => a.employeeId === selectedEmployee)
    if (existing && existing.turnId === selectedTurnId) { toast('La jornada ya está asignada a este empleado', { icon: 'ℹ️' }); return }

    try {
      api.assignTurn(selectedEmployee, selectedTurnId)
      toast.success('Jornada asignada correctamente')
      refresh()
      setSelectedEmployee('')
      setSelectedTurnId('')
      setAssignPage(1)
    } catch (err) {
      console.error(err)
      toast.error('No se pudo asignar la jornada')
    }
  }

  function openEditAssignment(a) {
    setEditingAssignment({ ...a })
  }

  async function saveAssignmentEdit(updated) {
    try {
      if (!editingAssignment) return
      if (!updated || !updated.employeeId || !updated.turnId) {
        toast.error('Debe seleccionar empleado y jornada')
        return
      }

      // If the employee was changed and that employee already has an assignment,
      // ask to replace it (or automatically replace)
      if (updated.employeeId !== editingAssignment.employeeId) {
        const existing = api.getTurnAssignments().find(a => a.employeeId === updated.employeeId)
        if (existing) {
          const ok = confirm('El empleado ya tiene una asignación. ¿Desea reemplazarla?')
          if (!ok) return
          try { api.unassignTurn(existing.id) } catch (e) { console.error(e) }
        }
      }

      api.updateTurnAssignment(editingAssignment.id, { employeeId: updated.employeeId, turnId: updated.turnId })
      toast.success('Asignación actualizada')
      setEditingAssignment(null)
      refresh()
    } catch (e) {
      console.error(e)
      toast.error('No se pudo actualizar la asignación')
    }
  }

  function handleSave(turn, resetCb) {
    const name = (turn.name || '').trim()

    if (!name) {
      toast.error('El turno debe tener un nombre')
      return
    }
    if (!turn.startTime || !turn.endTime) {
      toast.error('Debe indicar la hora de inicio y de fin')
      return
    }
    if (turn.startTime === turn.endTime) {
      toast.error('La hora de inicio y fin no pueden ser iguales')
      return
    }

    try {
      if (editing) {
        api.updateTurn(editing.id, { ...turn, name })
        toast.success('Turno actualizado correctamente')
        setEditing(null)
      } else {
        api.addTurn({ ...turn, name })
        toast.success('Turno creado correctamente')
      }
      refresh()
      resetCb && resetCb()
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error al guardar el turno')
    }
  }

  function handleCancelEdit() {
    setEditing(null)
    toast('Edición cancelada', { icon: '↩️' })
  }

  function askDelete(turn) {
    setTurnToDelete(turn)
    setConfirmOpen(true)
  }

  function handleConfirmDelete() {
    if (!turnToDelete) return
    try {
      api.deleteTurn(turnToDelete.id)
      toast.success('Turno eliminado correctamente')
      refresh()
    } catch (err) {
      console.error(err)
      toast.error('No se pudo eliminar el turno')
    } finally {
      setConfirmOpen(false)
      setTurnToDelete(null)
    }
  }

  // Buscador potente (global)
  const normalized = search.trim().toLowerCase()
  const tokens = normalized.split(/\s+/).filter(Boolean)

  const filteredItems = items.filter(t => {
    if (tokens.length === 0) return true
    const haystack = `${t.name} ${t.startTime} ${t.endTime}`.toLowerCase()
    return tokens.every(token => haystack.includes(token))
  })

  // Buscador local para la columna de jornadas
  const turnNormalized = turnSearch.trim().toLowerCase()
  const turnTokens = turnNormalized.split(/\s+/).filter(Boolean)
  const filteredTurns = items.filter(t => {
    if (turnTokens.length === 0) return true
    const hay = `${t.name} ${t.startTime} ${t.endTime}`.toLowerCase()
    return turnTokens.every(tok => hay.includes(tok))
  })

  const total = items.length
  const visible = filteredTurns.length

  const paginatedItems = filteredTurns.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Gestión de jornadas</h2>
          <p className="text-sm text-slate-500">
            Administra las jornadas (periodos de trabajo) y asígnalas rápidamente a empleados.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Mostrando <span className="font-semibold">{visible}</span> de{' '}
            <span className="font-semibold">{total}</span> jornadas.
          </p>
        </div>
      </div>

      {/* FORMULARIO Y ASIGNACIÓN: dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Izquierda: Formulario de jornadas + tabla de jornadas */}
        <div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <TurnForm onSave={handleSave} initial={editing} onCancelEdit={handleCancelEdit} />
          </div>

          <div className="mt-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <div className="p-3 border-b">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                  </svg>
                </span>
                <input type="text" placeholder="Buscar jornada por nombre u hora..." value={turnSearch} onChange={e => { setTurnSearch(e.target.value); setPage(1) }} className="w-full rounded-full border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-slate-600 text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Inicio</th>
                  <th className="px-4 py-2 text-left">Fin</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-400 py-6">No se encontraron turnos.</td>
                  </tr>
                )}

                {paginatedItems.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-2">{t.name}</td>
                    <td className="px-4 py-2">{t.startTime || '-'}</td>
                    <td className="px-4 py-2">{t.endTime || '-'}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button onClick={() => setEditing(t)} className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition">Editar</button>
                      <button onClick={() => askDelete(t)} className="px-3 py-1 rounded-md bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <Pagination total={filteredItems.length} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} />
          </div>
        </div>

        {/* Derecha: Asignación rápida y lista de asignaciones */}
        <aside className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">Asignación rápida</h3>
          <p className="text-xs text-slate-500 mb-3">Asigna una jornada a un empleado en un solo clic.</p>

          <form onSubmit={handleQuickAssign} className="flex flex-col gap-3">
            <label className="text-xs text-slate-600">Empleado</label>
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="rounded-full border px-3 py-2 text-sm">
              <option value="">Seleccione empleado...</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>

            <label className="text-xs text-slate-600">Jornada</label>
            <select value={selectedTurnId} onChange={e => setSelectedTurnId(e.target.value)} className="rounded-full border px-3 py-2 text-sm">
              <option value="">Seleccione jornada...</option>
              {items.map(t => <option key={t.id} value={t.id}>{t.name} {t.startTime ? `(${t.startTime} - ${t.endTime})` : ''}</option>)}
            </select>

            <div className="flex gap-2">
              <button className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm">Asignar jornada</button>
              <button type="button" onClick={() => { setSelectedEmployee(''); setSelectedTurnId('') }} className="rounded-full border px-4 py-2 text-sm">Limpiar</button>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold">Asignaciones</h4>
                <div className="flex items-center gap-2">
                  <select value={assignFilterTurn} onChange={e => { setAssignFilterTurn(e.target.value); setAssignPage(1) }} className="text-xs rounded-full border px-2 py-1">
                    <option value="">Todas las jornadas</option>
                    {items.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
                {(() => {
                  const assignments = api.getTurnAssignments().filter(s => (!selectedEmployee || s.employeeId === selectedEmployee) && (!assignFilterTurn || s.turnId === assignFilterTurn))
                  if (assignments.length === 0) return <div className="text-xs text-slate-400">Sin asignaciones</div>

                  // sort
                  assignments.sort((a, b) => {
                    const an = (employees.find(e => e.id === a.employeeId)?.name || a.employeeId).toLowerCase()
                    const bn = (employees.find(e => e.id === b.employeeId)?.name || b.employeeId).toLowerCase()
                    return an.localeCompare(bn)
                  })

                  const start = (assignPage - 1) * assignPageSize
                  const pageItems = assignments.slice(start, start + assignPageSize)

                  return (
                    <>
                      {pageItems.map(s => {
                        const t = items.find(x => x.id === s.turnId)
                        const emp = employees.find(e => e.id === s.employeeId)
                        return (
                          <div key={s.id} className="flex items-center justify-between gap-2 bg-white p-2 rounded-md border border-slate-100">
                            <div className="text-sm">
                              <div className="font-medium">{emp?.name || s.employeeId}</div>
                              <div className="text-xs text-slate-500">{t?.name || s.turnId}</div>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={() => openEditAssignment(s)} className="text-xs px-2 py-1 rounded-full bg-slate-100">Editar</button>
                              <button onClick={() => { if (!confirm('Quitar asignación?')) return; try { api.unassignTurn(s.id); toast('Asignación removida'); refresh(); } catch(e){ toast.error('No se pudo eliminar') } }} className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Quitar</button>
                            </div>
                          </div>
                        )
                      })}

                      <div className="mt-2">
                        <Pagination total={api.getTurnAssignments().length} page={assignPage} setPage={setAssignPage} pageSize={assignPageSize} setPageSize={setAssignPageSize} />
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </form>
        </aside>
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        open={confirmOpen}
        title="Eliminar turno"
        message={
          turnToDelete
            ? `¿Seguro que deseas eliminar el turno "${turnToDelete.name}"? Esta acción no se puede deshacer.`
            : '¿Seguro que deseas eliminar este turno?'
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onCancel={() => {
          setConfirmOpen(false)
          setTurnToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
      />
      <AssignmentModal assignment={editingAssignment} employees={employees} turns={items} onSave={saveAssignmentEdit} onCancel={() => setEditingAssignment(null)} />
      </div>
    </div>
  )
}

/* MODAL REUTILIZABLE */
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Sí, continuar',
  cancelLabel = 'Cancelar',
  onCancel,
  onConfirm,
}) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Fondo oscuro full-screen */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Tarjeta del modal */}
      <div className="relative z-10 w-[min(420px,90%)] rounded-2xl bg-white shadow-2xl p-6">
        <h3 className="text-base font-semibold text-slate-900">
          {title || 'Confirmar acción'}
        </h3>
        {message && (
          <p className="mt-2 text-sm text-slate-600">
            {message}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* MODAL PARA EDITAR ASIGNACIÓN */
function AssignmentModal({ assignment, employees = [], turns = [], onSave, onCancel }) {
  const empty = { employeeId: '', turnId: '' }
  const [form, setForm] = useState(assignment ? { employeeId: assignment.employeeId, turnId: assignment.turnId } : empty)

  useEffect(() => {
    setForm(assignment ? { employeeId: assignment.employeeId, turnId: assignment.turnId } : empty)
  }, [assignment])

  if (!assignment) return null

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 w-[min(480px,95%)] bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-semibold">Editar asignación</h3>
        <p className="text-sm text-slate-600 mt-2">Cambia el empleado o la jornada asignada.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-slate-600">Empleado</label>
            <select value={form.employeeId || ''} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="mt-1 w-full rounded-full border px-3 py-2">
              <option value="">Seleccione empleado...</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Jornada</label>
            <select value={form.turnId || ''} onChange={e => setForm({ ...form, turnId: e.target.value })} className="mt-1 w-full rounded-full border px-3 py-2">
              <option value="">Seleccione jornada...</option>
              {turns.map(t => <option key={t.id} value={t.id}>{t.name} {t.startTime ? `(${t.startTime} - ${t.endTime})` : ''}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full border px-4 py-2 text-sm">Cancelar</button>
          <button type="button" disabled={!form.employeeId || !form.turnId} onClick={() => onSave(form)} className={`rounded-full px-4 py-2 text-sm ${(!form.employeeId || !form.turnId) ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white'}`}>
            Guardar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
