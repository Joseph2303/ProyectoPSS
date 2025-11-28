import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api/mockApi'
import { toast } from 'react-hot-toast'
import Pagination from '../components/Pagination'

/* FORMULARIO DE EMPLEADO */
function EmployeeForm({ onSave, initial, onCancelEdit }) {
  const empty = { firstName: '', lastName: '', email: '', phone: '', cedula: '', address: '', emergencyContact: '' }

  const [form, setForm] = useState(initial || { ...empty, active: true })

  // Cuando recibimos `initial` debemos soportar objetos antiguos con `name`
  useEffect(() => {
    if (!initial) {
      setForm({ ...empty, active: true })
      return
    }

    const first = initial.firstName ?? (initial.name ? initial.name.split(' ')[0] : '')
    const last = initial.lastName ?? (initial.name ? initial.name.split(' ').slice(1).join(' ') : '')
    const active = initial.active === undefined ? true : Boolean(initial.active)
    const email = initial.email || ''
    const phone = initial.phone || ''
    const cedula = initial.cedula || ''
    const address = initial.address || ''
    const emergencyContact = initial.emergencyContact || ''

    setForm({ ...initial, firstName: first, lastName: last, active, email, phone, cedula, address, emergencyContact })
  }, [initial])

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form, () => setForm(empty))
  }

  function handleReset() {
    setForm({ ...empty, active: true })
    onCancelEdit && onCancelEdit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200"
    >
      <input
        placeholder="Nombre"
        value={form.firstName}
        onChange={e => setForm({ ...form, firstName: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        placeholder="Apellidos"
        value={form.lastName}
        onChange={e => setForm({ ...form, lastName: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        placeholder="Correo electrónico"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        placeholder="Teléfono"
        value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <input
        placeholder="Cédula"
        value={form.cedula}
        onChange={e => setForm({ ...form, cedula: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        placeholder="Dirección"
        value={form.address}
        onChange={e => setForm({ ...form, address: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        placeholder="Contacto de emergencia"
        value={form.emergencyContact}
        onChange={e => setForm({ ...form, emergencyContact: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded" />
          <span className="text-sm">Activo</span>
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          {initial ? 'Actualizar' : 'Guardar'}
        </button>

        {initial && (
          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

/* PÁGINA PRINCIPAL */
export default function EmployeesPage() {
  const [items, setItems] = useState([])
  const [positions, setPositions] = useState([])
  const [assignments, setAssignments] = useState([])
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  function getFullName(emp) {
    if (!emp) return ''
    const first = emp.firstName ?? (emp.name ? emp.name.split(' ')[0] : '')
    const last = emp.lastName ?? (emp.name ? emp.name.split(' ').slice(1).join(' ') : '')
    return `${first} ${last}`.trim()
  }

  // estado para modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [menuOpen, setMenuOpen] = useState(null)

  useEffect(() => {
    try {
      setItems(api.getEmployees())
      setPositions(api.getPositions ? api.getPositions() : [])
      setAssignments(api.getAssignments ? api.getAssignments() : [])
    } catch (err) {
      console.error(err)
      toast.error('Error cargando la lista de empleados')
    }
  }, [])

  // cerrar menú de acciones al hacer click fuera
  useEffect(() => {
    function onDocClick() {
      setMenuOpen(null)
    }
    window.addEventListener('click', onDocClick)
    return () => window.removeEventListener('click', onDocClick)
  }, [])

  // reset page when filters or items change
  useEffect(() => {
    setPage(1)
  }, [search, items])

  function refresh() {
    try {
      setItems(api.getEmployees())
      setPositions(api.getPositions ? api.getPositions() : [])
      setAssignments(api.getAssignments ? api.getAssignments() : [])
    } catch (err) {
      console.error(err)
      toast.error('No se pudieron refrescar los empleados')
    }
  }

  function handleSave(emp, resetCb) {
    const firstName = (emp.firstName || '').trim()
    const lastName = (emp.lastName || '').trim()
    const email = (emp.email || '').trim()
    const phone = (emp.phone || '').trim()
    const cedula = (emp.cedula || '').trim()
    const address = (emp.address || '').trim()
    const emergencyContact = (emp.emergencyContact || '').trim()

    if (!firstName) {
      toast.error('El empleado debe tener al menos un nombre')
      return
    }

    const fullName = `${firstName}${lastName ? ' ' + lastName : ''}`

    try {
      const payload = {
        ...emp,
        firstName,
        lastName,
        email,
        phone,
        cedula,
        address,
        emergencyContact,
        name: fullName,
      }

      if (editing) {
        api.updateEmployee(editing.id, payload)
        toast.success('Empleado actualizado correctamente')
        setEditing(null)
      } else {
        api.addEmployee(payload)
        toast.success('Empleado registrado correctamente')
      }
      refresh()
      resetCb && resetCb()
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error al guardar el empleado')
    }
  }

  function handleCancelEdit() {
    setEditing(null)
    setFormOpen(false)
    toast('Edición cancelada', { icon: '↩️' })
  }

  function askDelete(emp) {
    setEmployeeToDelete(emp)
    setConfirmOpen(true)
  }

  function handleConfirmDelete() {
    if (!employeeToDelete) return
    try {
      api.deleteEmployee(employeeToDelete.id)
      toast.success('Empleado eliminado correctamente')
      refresh()
    } catch (err) {
      console.error(err)
      toast.error('No se pudo eliminar el empleado')
    } finally {
      setConfirmOpen(false)
      setEmployeeToDelete(null)
    }
  }

  // --- BUSCADOR POTENTE ---
  const normalizedSearch = search.trim().toLowerCase()
  const tokens = normalizedSearch.split(/\s+/).filter(Boolean)

  // Enriquecer empleados con su puesto (si existe)
  const enrichedItems = items.map(it => {
    const assign = assignments.find(a => String(a.employeeId) === String(it.id))
    const pos = assign && positions.find(p => String(p.id) === String(assign.positionId))
    return { ...it, position: pos ? pos.name : undefined }
  })

  const filteredItems = enrichedItems.filter(emp => {
    if (tokens.length === 0) return true

    const haystack = `${emp.firstName || (emp.name || '').split(' ')[0] || ''} ${
      emp.lastName || (emp.name || '').split(' ').slice(1).join(' ') || ''
    } ${emp.position || ''} ${emp.code || ''}`.toLowerCase()

    return tokens.every(token => haystack.includes(token))
  })

  const total = items.length
  const visible = filteredItems.length

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6">
      {/* HEADER + BUSCADOR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Gestión de empleados</h2>
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
              placeholder="Buscar por nombre o apellidos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Puedes escribir nombre y/o apellidos: ej. <span className="italic">juan pérez</span>.
          </p>
        </div>
      </div>

      {/* BOTÓN PARA ABRIR FORMULARIO EN MODAL */}
      <div className="flex justify-end">
        <button
          onClick={() => { setEditing(null); setFormOpen(true) }}
          className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          Nuevo empleado
        </button>
      </div>

      {/* MODAL DEL FORMULARIO */}
      <EmployeeModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }}>
        <EmployeeForm
          onSave={(emp, resetCb) => {
            handleSave(emp, () => {
              resetCb && resetCb()
              setFormOpen(false)
            })
          }}
          initial={editing}
          onCancelEdit={() => { handleCancelEdit(); setFormOpen(false) }}
        />
      </EmployeeModal>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr className="text-slate-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Apellidos</th>
              <th className="px-4 py-2 text-left">Correo</th>
              <th className="px-4 py-2 text-left">Teléfono</th>
              <th className="px-4 py-2 text-left">Cédula</th>
              <th className="px-4 py-2 text-left">Dirección</th>
              <th className="px-4 py-2 text-left">Contacto emergencia</th>
              <th className="px-4 py-2 text-left">Puesto</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-slate-400 py-6">
                  No se encontraron empleados con ese criterio de búsqueda.
                </td>
              </tr>
            )}

            {paginatedItems.map(it => (
              <tr
                key={it.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition"
              >
                {(() => {
                  const first = it.firstName ?? (it.name ? it.name.split(' ')[0] : '')
                  const last = it.lastName ?? (it.name ? it.name.split(' ').slice(1).join(' ') : '')
                  return (
                          <>
                            <td className="px-4 py-2">{first}</td>
                            <td className="px-4 py-2">{last}</td>
                            <td className="px-4 py-2">{it.email || '—'}</td>
                            <td className="px-4 py-2">{it.phone || '—'}</td>
                            <td className="px-4 py-2">{it.cedula || '—'}</td>
                            <td className="px-4 py-2">{it.address || '—'}</td>
                            <td className="px-4 py-2">{it.emergencyContact || '—'}</td>
                            <td className="px-4 py-2">{it.position || '—'}</td>
                            <td className="px-4 py-2">
                              {it.active ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Activo</span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">Inactivo</span>
                              )}
                            </td>
                          </>
                  )
                })()}
                <td className="px-4 py-2 flex gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!it.active}
                      onChange={e => {
                        const newVal = e.target.checked
                        try {
                          // enviar el objeto completo para evitar sobreescribir/omitir campos relacionados (p.ej. posición)
                          api.updateEmployee(it.id, { ...it, active: newVal })
                          toast.success(newVal ? 'Empleado activado' : 'Empleado desactivado')
                          refresh()
                        } catch (err) {
                          console.error(err)
                          toast.error('No se pudo cambiar el estado')
                        }
                      }}
                      title={it.active ? 'Marcar como inactivo' : 'Marcar como activo'}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                  </label>

                  <button
                    onClick={() => { setEditing(it); setFormOpen(true) }}
                    className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition"
                  >
                    Editar
                  </button>


                  <button
                    onClick={() => askDelete(it)}
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
      <Pagination
        total={filteredItems.length}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {/* MODAL DE CONFIRMACIÓN */}
      <ConfirmModal
        open={confirmOpen}
        title="Eliminar empleado"
        message={
          employeeToDelete
            ? `¿Seguro que deseas eliminar a "${getFullName(employeeToDelete)}" (código ${employeeToDelete.code})? Esta acción no se puede deshacer.`
            : '¿Seguro que deseas eliminar este empleado?'
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onCancel={() => {
          setConfirmOpen(false)
          setEmployeeToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
      />
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

/* MODAL PARA EL FORMULARIO DE EMPLEADO */
function EmployeeModal({ open, onClose, children }) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 w-[min(900px,95%)] rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Empleado</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  )
}
