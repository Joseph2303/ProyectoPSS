import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api/mockApi'
import { toast } from 'react-hot-toast'
import Pagination from '../components/Pagination'

/* FORMULARIO DE EMPLEADO */
function EmployeeForm({ onSave, initial, onCancelEdit }) {
  const empty = { firstName: '', lastName: '' }

  const [form, setForm] = useState(initial || empty)

  // Cuando recibimos `initial` debemos soportar objetos antiguos con `name`
  useEffect(() => {
    if (!initial) {
      setForm(empty)
      return
    }

    const first = initial.firstName ?? (initial.name ? initial.name.split(' ')[0] : '')
    const last = initial.lastName ?? (initial.name ? initial.name.split(' ').slice(1).join(' ') : '')

    setForm({ ...initial, firstName: first, lastName: last })
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

      {/* Botones ocupan las dos columnas restantes en md */}
      <div className="flex gap-2 md:col-span-2">
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

/* PÁGINA PRINCIPAL */
export default function EmployeesPage() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
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

  useEffect(() => {
    try {
      setItems(api.getEmployees())
    } catch (err) {
      console.error(err)
      toast.error('Error cargando la lista de empleados')
    }
  }, [])

  // reset page when filters or items change
  useEffect(() => {
    setPage(1)
  }, [search, items])

  function refresh() {
    try {
      setItems(api.getEmployees())
    } catch (err) {
      console.error(err)
      toast.error('No se pudieron refrescar los empleados')
    }
  }

  function handleSave(emp, resetCb) {
    const firstName = (emp.firstName || '').trim()
    const lastName = (emp.lastName || '').trim()

    if (!firstName) {
      toast.error('El empleado debe tener al menos un nombre')
      return
    }

    const fullName = `${firstName}${lastName ? ' ' + lastName : ''}`

    try {
      if (editing) {
        api.updateEmployee(editing.id, { ...emp, firstName, lastName, name: fullName })
        toast.success('Empleado actualizado correctamente')
        setEditing(null)
      } else {
        api.addEmployee({ ...emp, firstName, lastName, name: fullName })
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

  const filteredItems = items.filter(emp => {
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

      {/* FORMULARIO */}
      <EmployeeForm
        onSave={handleSave}
        initial={editing}
        onCancelEdit={handleCancelEdit}
      />

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr className="text-slate-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Apellidos</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-slate-400 py-6">
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
                    </>
                  )
                })()}
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => setEditing(it)}
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
