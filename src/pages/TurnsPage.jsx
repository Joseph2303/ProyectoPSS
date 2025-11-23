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

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // estado para el modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [turnToDelete, setTurnToDelete] = useState(null)

  useEffect(() => {
    try {
      setItems(api.getTurns())
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
    } catch (err) {
      console.error(err)
      toast.error('No se pudieron refrescar los turnos')
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

  // Buscador potente
  const normalized = search.trim().toLowerCase()
  const tokens = normalized.split(/\s+/).filter(Boolean)

  const filteredItems = items.filter(t => {
    if (tokens.length === 0) return true
    const haystack = `${t.name} ${t.startTime} ${t.endTime}`.toLowerCase()
    return tokens.every(token => haystack.includes(token))
  })

  const total = items.length
  const visible = filteredItems.length

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Gestión de turnos</h2>
          <p className="text-sm text-slate-500">
            Administra los diferentes turnos de trabajo.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Mostrando <span className="font-semibold">{visible}</span> de{' '}
            <span className="font-semibold">{total}</span> turnos.
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
              placeholder="Buscar turnos por nombre u hora..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="mt-1 text-[11px] text-slate-400">
            Puedes buscar por nombre o por horas: Ej. <i>matutino 08:00</i>
          </p>
        </div>
      </div>

      {/* FORMULARIO */}
      <TurnForm onSave={handleSave} initial={editing} onCancelEdit={handleCancelEdit} />

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                <td colSpan={4} className="text-center text-slate-400 py-6">
                  No se encontraron turnos con ese criterio de búsqueda.
                </td>
              </tr>
            )}

            {paginatedItems.map(t => (
              <tr
                key={t.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition"
              >
                <td className="px-4 py-2">{t.name}</td>
                <td className="px-4 py-2">{t.startTime || '-'}</td>
                <td className="px-4 py-2">{t.endTime || '-'}</td>

                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => setEditing(t)}
                    className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => askDelete(t)}
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
