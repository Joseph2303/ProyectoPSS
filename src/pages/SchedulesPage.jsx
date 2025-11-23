import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api/mockApi'
import { toast } from 'react-hot-toast'
import Pagination from '../components/Pagination'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const WEEKDAY_MAP = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** Ver si un horario aplica para una fecha específica (día + rango de fechas) */
function scheduleMatchesDate(schedule, dateStr) {
  if (!dateStr) return true
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return true

  const weekdayName = WEEKDAY_MAP[d.getDay()] // Dom..Sáb

  // Día de la semana (solo si el horario tiene días definidos)
  if (schedule.days && schedule.days.length && !schedule.days.includes(weekdayName)) {
    return false
  }

  // Rango de fechas
  if (schedule.startDate && dateStr < schedule.startDate) return false
  if (schedule.endDate && dateStr > schedule.endDate) return false

  return true
}

/** Ver si un horario se cruza con un rango de fechas (por cadenas YYYY-MM-DD) */
function scheduleOverlapsRange(schedule, start, end) {
  if (!start && !end) return true

  const rangeStart = start || '0000-01-01'
  const rangeEnd = end || '9999-12-31'
  const schedStart = schedule.startDate || '0000-01-01'
  const schedEnd = schedule.endDate || '9999-12-31'

  // Hay traslape si los rangos se cruzan
  return schedStart <= rangeEnd && schedEnd >= rangeStart
}

/* FORMULARIO DE HORARIO (simple) */
function ScheduleForm({ onSave, initial, employees, turns, onCancelEdit }) {
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
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">
          {initial ? 'Editar horario' : 'Nuevo horario'}
        </h3>
        {initial && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Cancelar edición
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Columna izquierda */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Empleado</label>
            <select
              value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}
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
            <label className="text-xs font-semibold text-slate-600">Turno</label>
            <select
              value={form.turnId}
              onChange={e => setForm({ ...form, turnId: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un turno...</option>
              {turns.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}{' '}
                  {t.startTime && t.endTime ? `(${t.startTime} - ${t.endTime})` : ''}
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
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Día libre</label>
            <input
              value={form.freeDay}
              onChange={e => setForm({ ...form, freeDay: e.target.value })}
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
              onChange={e => setForm({ ...form, startDate: e.target.value })}
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
              onChange={e => setForm({ ...form, endDate: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              Puedes dejar la fecha de fin vacía si el horario es indefinido.
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              {initial ? 'Actualizar horario' : 'Guardar horario'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Limpiar
            </button>
          </div>
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // filtros
  const [filterEmployeeId, setFilterEmployeeId] = useState('')

  // fecha específica
  const [filterSingleDate, setFilterSingleDate] = useState('')

  // rango de fechas
  const [filterRangeStart, setFilterRangeStart] = useState('')
  const [filterRangeEnd, setFilterRangeEnd] = useState('')

  // texto libre
  const [filterText, setFilterText] = useState('')

  // modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState(null)

  useEffect(() => {
    try {
      setSchedules(api.getSchedules())
      setEmployees(api.getEmployees())
      setTurns(api.getTurns())
    } catch (err) {
      console.error(err)
      toast.error('Error cargando los datos de horarios')
    }
  }, [])

  // reset page when filters or schedules change
  useEffect(() => {
    setPage(1)
  }, [filterEmployeeId, filterSingleDate, filterRangeStart, filterRangeEnd, filterText, schedules])

  function refresh() {
    try {
      setSchedules(api.getSchedules())
    } catch (err) {
      console.error(err)
      toast.error('No se pudieron refrescar los horarios')
    }
  }

  function handleSave(form, onSuccessReset) {
    if (!form.employeeId || !form.turnId) {
      toast.error('Debe seleccionar empleado y turno')
      return
    }
    if (!form.days || form.days.length === 0) {
      toast.error('Debe seleccionar al menos un día de trabajo')
      return
    }

    try {
      if (editing) {
        api.updateSchedule(editing.id, form)
        toast.success('Horario actualizado correctamente')
        setEditing(null)
      } else {
        api.addSchedule(form)
        toast.success('Horario creado correctamente')
      }
      refresh()
      onSuccessReset && onSuccessReset()
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error al guardar el horario')
    }
  }

  function askDelete(schedule) {
    setScheduleToDelete(schedule)
    setConfirmOpen(true)
  }

  function handleConfirmDelete() {
    if (!scheduleToDelete) return
    try {
      api.deleteSchedule(scheduleToDelete.id)
      toast.success('Horario eliminado correctamente')
      refresh()
    } catch (err) {
      console.error(err)
      toast.error('No se pudo eliminar el horario')
    } finally {
      setConfirmOpen(false)
      setScheduleToDelete(null)
    }
  }

  function handleCancelEdit() {
    setEditing(null)
    toast('Edición cancelada', { icon: '↩️' })
  }

  // Enriquecer con empleado y turno
  const enrichedSchedules = schedules.map(s => {
    const emp = employees.find(e => e.id === s.employeeId) || {}
    const turn = turns.find(t => t.id === s.turnId) || {}
    return { ...s, _emp: emp, _turn: turn }
  })

  // Filtros
  const q = filterText.trim().toLowerCase()

  const filtered = enrichedSchedules.filter(s => {
    // Filtro por empleado
    if (filterEmployeeId && s.employeeId !== filterEmployeeId) return false

    // Filtro por fecha específica (tiene prioridad TOTAL)
    if (filterSingleDate) {
      if (!scheduleMatchesDate(s, filterSingleDate)) return false
    } else if (filterRangeStart || filterRangeEnd) {
      // Si no hay fecha específica, aplicamos el rango
      if (!scheduleOverlapsRange(s, filterRangeStart, filterRangeEnd)) return false
    }

    // Filtro por texto
    if (!q) return true

    const haystack = [
      s._emp.name || '',
      s._emp.position || '',
      s._turn.name || '',
      (s.days || []).join(' '),
      s.freeDay || '',
      s.startDate || '',
      s.endDate || '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })

  const total = schedules.length

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Horarios de trabajo
          </h2>
          <p className="text-sm text-slate-500">
            Asigna turnos a las personas empleadas y consulta los horarios existentes.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Mostrando{' '}
            <span className="font-semibold">{filtered.length}</span> de{' '}
            <span className="font-semibold">{total}</span> horarios.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <ScheduleForm
        onSave={handleSave}
        initial={editing}
        employees={employees}
        turns={turns}
        onCancelEdit={handleCancelEdit}
      />

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-3 items-end">
        {/* Empleado */}
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-slate-600">Empleado</span>
          <select
            value={filterEmployeeId}
            onChange={e => setFilterEmployeeId(e.target.value)}
            className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
          >
            <option value="">Todos</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha específica */}
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-slate-600">Fecha específica</span>
          <input
            type="date"
            value={filterSingleDate}
            onChange={e => {
              const v = e.target.value
              setFilterSingleDate(v)
              if (v) {
                // si se define una fecha específica, limpiamos el rango
                setFilterRangeStart('')
                setFilterRangeEnd('')
              }
            }}
            className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-[10px] text-slate-400">
            Si eliges una fecha, el rango se desactiva.
          </span>
        </div>

        {/* Rango de fechas */}
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-slate-600">
            Rango de fechas (desde / hasta)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterRangeStart}
              onChange={e => {
                const v = e.target.value
                setFilterRangeStart(v)
                if (v) {
                  // si empiezo a usar rango, limpio la fecha específica
                  setFilterSingleDate('')
                }
              }}
              className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400">a</span>
            <input
              type="date"
              value={filterRangeEnd}
              onChange={e => {
                const v = e.target.value
                setFilterRangeEnd(v)
                if (v) {
                  setFilterSingleDate('')
                }
              }}
              className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <span className="text-[10px] text-slate-400">
            Solo se usa si no hay fecha específica.
          </span>
        </div>

        {/* Texto libre */}
        <div className="flex-1 min-w-[180px] flex flex-col gap-1 text-xs">
          <span className="font-semibold text-slate-600">Buscar texto</span>
          <input
            type="text"
            placeholder="Nombre, turno, días..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Botón limpiar */}
        {filterEmployeeId ||
        filterSingleDate ||
        filterRangeStart ||
        filterRangeEnd ||
        filterText ? (
          <button
            type="button"
            onClick={() => {
              setFilterEmployeeId('')
              setFilterSingleDate('')
              setFilterRangeStart('')
              setFilterRangeEnd('')
              setFilterText('')
              toast('Filtros limpiados', { icon: '🧹' })
            }}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="max-h-[60vh] overflow-auto">
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
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-slate-400"
                  >
                    No hay horarios con los filtros actuales.
                  </td>
                </tr>
              )}

              {paginated.map(s => (
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
                    {s.days && s.days.length ? s.days.join(', ') : '—'}
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
                      onClick={() => askDelete(s)}
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

        <Pagination
          total={filtered.length}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />

      {/* Modal de confirmación bonito */}
      <ConfirmModal
        open={confirmOpen}
        title="Eliminar horario"
        message={
          scheduleToDelete
            ? `¿Seguro que deseas eliminar el horario de ${
                scheduleToDelete._emp?.name || 'esta persona'
              }? Esta acción no se puede deshacer.`
            : '¿Seguro que deseas eliminar este horario?'
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onCancel={() => {
          setConfirmOpen(false)
          setScheduleToDelete(null)
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

      {/* Tarjeta */}
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
