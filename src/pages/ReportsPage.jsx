import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import { api } from '../api/mockApi'

export default function ReportsPage(){
  const [reports, setReports] = useState([])
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [employees, setEmployees] = useState([])
  const [turns, setTurns] = useState([])
  const [keys, setKeys] = useState([])
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null })
  const [editingReportId, setEditingReportId] = useState(null)
  const [editingNotes, setEditingNotes] = useState('')

  function refresh(){
    setReports(api.getReports().slice().reverse())
    setEmployees(api.getEmployees())
    setTurns(api.getTurns())
    setKeys(api.getKeys())
  }

  useEffect(()=>{ refresh() }, [])

  function pad(n){ return String(n).padStart(2,'0') }
  function formatTime(dateLike, withSeconds = false){
    if(!dateLike) return ''
    const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike)
    if (isNaN(d.getTime())) return ''
    const hh = pad(d.getHours())
    const mm = pad(d.getMinutes())
    if(withSeconds){
      const ss = pad(d.getSeconds())
      return `${hh}:${mm}:${ss}`
    }
    return `${hh}:${mm}`
  }

  function formatDate(dateLike){
    if(!dateLike) return ''
    const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike)
    if (isNaN(d.getTime())) return ''
    const dd = pad(d.getDate())
    const mm = pad(d.getMonth()+1)
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy} ${formatTime(d, false)}`
  }

  async function doExport(){
    // Export using active filters (employee/date) to Excel via SheetJS
    const filteredForExport = reports.filter(r => {
      if (selectedEmployeeId) {
        const empMatch = (r.employeeId && r.employeeId === selectedEmployeeId) || (r.employee && r.employee.id === selectedEmployeeId)
        if (!empMatch) return false
      }
      if (selectedDate) {
        const dateStr = (() => {
          if (r.timestamp) return new Date(r.timestamp).toISOString().slice(0,10)
          const rt = reportTimes(r)
          const d = rt.start || rt.end || null
          return d ? new Date(d).toISOString().slice(0,10) : null
        })()
        if (!dateStr || dateStr !== selectedDate) return false
      }
      return true
    })

    // Map reports to flat rows for Excel. Use Date objects where appropriate so Excel
    // recognizes them as dates/times. We'll set column widths, freeze header and add autofilter.
    const rows = filteredForExport.map(r => {
      const times = reportTimes(r)
      const start = times.start ? new Date(times.start) : null
      const end = times.end ? new Date(times.end) : null
      const duration = r.durationMin ? `${r.durationMin}m` : (start && end ? `${Math.round((end - start)/60000)}m` : '—')
      const items = (r.items || r.keys || [])
      const claves = items.map(i => {
        const label = `${i.clave || ''}${i.type ? ` (${i.type})` : ''}`
        const s = i.createdAt ? formatTime(i.createdAt, false) : ''
        const e = i.closedAt ? formatTime(i.closedAt, false) : ''
        const timesStr = s && e ? `${s}-${e}` : (s || '')
        return timesStr ? `${label} ${timesStr}` : label
      }).join(', ')
      return {
        Fecha: r.timestamp ? formatDate(r.timestamp) : (start ? formatDate(start) : ''),
        Empleado: r.employee?.name || r.employeeId || '',
        Turno: r.turn?.name || r.turnId || '',
        Entrada: start ? formatTime(start, false) : '',
        Salida: end ? formatTime(end, false) : '',
        Duracion: duration,
        Claves: claves,
        Notas: r.notes || '',
        TipoReporte: r.type || ''
      }
    })

    // Try advanced export with exceljs for exact styling. If exceljs is not available
    // or fails, fall back to the SheetJS implementation used previously.
    try {
      const ExcelJS = await import('exceljs')
      const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook
      const workbook = new Workbook()
      const ws = workbook.addWorksheet('Reportes')

      // Define columns with widths
      ws.columns = [
        { header: 'Fecha', key: 'Fecha', width: 20 },
        { header: 'Empleado', key: 'Empleado', width: 25 },
        { header: 'Turno', key: 'Turno', width: 18 },
        { header: 'Entrada', key: 'Entrada', width: 18 },
        { header: 'Salida', key: 'Salida', width: 18 },
        { header: 'Duracion', key: 'Duracion', width: 10 },
        { header: 'Claves', key: 'Claves', width: 45 },
        { header: 'Notas', key: 'Notas', width: 40 },
        { header: 'TipoReporte', key: 'TipoReporte', width: 16 }
      ]

      // Header row on first row to match the provided design (no merged title)
      const headerRow = ws.getRow(1)
      const headers = ws.columns.map(c => c.header)
      headerRow.values = headers
      headerRow.height = 20

      // Freeze header row
      ws.views = [{ state: 'frozen', ySplit: 1 }]

      // Add header styling (row 1) - teal background like the mock
      const headerFillColor = 'FF26A6B6' // approximate teal from the screenshot
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFillColor } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        }
      })

      // Add data rows starting after header
      rows.forEach(r => {
        // Use the already-formatted string values to avoid parsing issues (we format as dd/MM/yyyy HH:mm and HH:mm)
        const rowVals = [
          r.Fecha || '',
          r.Empleado || '',
          r.Turno || '',
          r.Entrada || '',
          r.Salida || '',
          r.Duracion || '',
          r.Claves || '',
          r.Notas || '',
          r.TipoReporte || ''
        ]
        ws.addRow(rowVals)
      })

      // We write Fecha/Entrada/Salida as formatted strings (dd/mm/yyyy HH:mm / HH:mm),
      // so no numeric date formatting is required for exceljs.

      // Autofilter for header
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } }

      // Alternate row shading and TipoReporte colors
      for (let rIndex = 2; rIndex <= ws.rowCount; rIndex++) {
        const row = ws.getRow(rIndex)
        if ((rIndex % 2) === 0) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F8' } }
          })
        }
        const trCell = row.getCell(ws.columns.length)
        const val = (trCell.value || '').toString().toLowerCase()
        if (val.includes('absent')) {
          trCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDECEA' } }
          trCell.font = { color: { argb: 'FF9B1A1A' }, bold: true }
        } else if (val.includes('late')) {
          trCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4E5' } }
          trCell.font = { color: { argb: 'FF8A4B00' }, bold: true }
        } else if (val.includes('shift')) {
          trCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FBF0' } }
          trCell.font = { color: { argb: 'FF0F5132' }, bold: true }
        }
      }

      // Write workbook to buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reportes.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return
    } catch (exc) {
      console.warn('exceljs export failed, falling back to SheetJS export', exc)
    }

    // Fallback: previous SheetJS implementation (keeps existing behavior)
    try {
      // Convert to worksheet. dateNF helps with initial formatting in some environments.
      const ws = XLSX.utils.json_to_sheet(rows, { dateNF: 'dd/mm/yyyy HH:MM' })

      // Suggest column widths (wch = characters width)
      ws['!cols'] = [
        { wch: 20 }, // Fecha
        { wch: 25 }, // Empleado
        { wch: 18 }, // Turno
        { wch: 12 }, // Entrada
        { wch: 12 }, // Salida
        { wch: 10 }, // Duracion
        { wch: 45 }, // Claves
        { wch: 40 }, // Notas
        { wch: 16 }  // TipoReporte
      ]

      // Freeze top row for easier reading
      ws['!freeze'] = { ySplit: 1 }

      // Enable autofilter on the header row (works in Excel)
      if (ws['!ref']) ws['!autofilter'] = { ref: ws['!ref'] }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Reportes')
      XLSX.writeFile(wb, 'reportes.xlsx')
    } catch (e) {
      // fallback to JSON if SheetJS fails
      const data = JSON.stringify(filteredForExport, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reports.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
  }

  function doClear(){
    if(!confirm('Borrar todos los reportes?')) return
    api.clearReports()
    refresh()
  }

  

  function requestConfirm(message, onConfirm){
    setConfirmState({ open: true, message: String(message || ''), onConfirm: typeof onConfirm === 'function' ? onConfirm : null })
  }

  function closeConfirm(commit = false){
    const cb = confirmState.onConfirm
    setConfirmState({ open: false, message: '', onConfirm: null })
    if (commit && cb) cb()
  }

  function closeKey(id){
    requestConfirm('Confirmar cierre de clave?', ()=>{
      api.closeKey(id)
      refresh()
    })
  }

  function startEditNotes(report){
    setEditingReportId(report.id)
    setEditingNotes(report.notes || '')
  }

  function cancelEditNotes(){
    setEditingReportId(null)
    setEditingNotes('')
  }

  function saveEditNotes(){
    if(!editingReportId) return
    api.updateReport(editingReportId, { notes: editingNotes })
    setEditingReportId(null)
    setEditingNotes('')
    refresh()
  }

  const normalized = search.trim().toLowerCase()
  const filtered = reports.filter(r=>{
    if(filterType && r.type !== filterType) return false
    if(!normalized) return true
    return (r.clave||'').toLowerCase().includes(normalized) || (r.employeeId||'').toLowerCase().includes(normalized) || (r.type||'').toLowerCase().includes(normalized)
  })

  function empName(id){
    return employees.find(e=>e.id===id)?.name || id || '—'
  }

  function turnName(id){
    return turns.find(t=>t.id===id)?.name || id || '—'
  }

  function formatDurationForKey(keyId){
    const k = api.getKeys().find(x=>x.id===keyId)
    if(!k) return null
    if(!k.closedAt) return null
    const start = new Date(k.createdAt)
    const end = new Date(k.closedAt)
    const mins = Math.round((end - start)/60000)
    if(mins >= 60) return `${Math.floor(mins/60)}h ${mins%60}m`
    return `${mins}m`
  }

  function reportTimes(r){
    // determine start and end for a report (shift_report or row_snapshot)
    if(r.start || r.end) return { start: r.start || null, end: r.end || null }
    const list = (r.items || r.keys || [])
    if(!list || list.length === 0) return { start: null, end: null }
    const starts = list.map(x => x.createdAt).filter(Boolean).map(s=>new Date(s))
    const ends = list.map(x => x.closedAt || null).filter(Boolean).map(s=>new Date(s))
    const start = starts.length ? new Date(Math.min(...starts.map(d=>d.getTime()))) : null
    const end = ends.length ? new Date(Math.max(...ends.map(d=>d.getTime()))) : (starts.length ? new Date(Math.max(...starts.map(d=>d.getTime()))) : null)
    return { start: start ? start.toISOString() : null, end: end ? end.toISOString() : null }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reportes</h2>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedEmployeeId} onChange={e=>setSelectedEmployeeId(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1 text-sm bg-white">
            <option value="">Todos los empleados</option>
            {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
          </select>
          <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1 text-sm bg-white" />
          <button onClick={() => { setSelectedEmployeeId(''); setSelectedDate('') }} className="rounded-full border border-slate-200 px-3 py-1 text-sm">Borrar filtros</button>
          <button onClick={doExport} className="rounded-full bg-blue-600 text-white px-3 py-1 text-sm">Exportar</button>
          <button onClick={refresh} className="rounded-full border border-slate-200 px-3 py-1 text-sm">Refrescar</button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full table-auto border-collapse text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                <th className="px-3 py-2 text-left font-semibold">Empleado</th>
                <th className="px-3 py-2 text-left font-semibold">Turno</th>
                <th className="px-3 py-2 text-left font-semibold">Entrada</th>
                <th className="px-3 py-2 text-left font-semibold">Salida</th>
                <th className="px-3 py-2 text-left font-semibold">Duración</th>
                <th className="px-3 py-2 text-left font-semibold">Historial de Marcas</th>
                <th className="px-3 py-2 text-left font-semibold">Notas</th>
              </tr>
            </thead>
            <tbody>
              {reports
                .filter(r => (r.type === 'shift_report' || r.type === 'row_snapshot'))
                .filter(r => {
                  if (selectedEmployeeId) {
                    const empMatch = (r.employeeId && r.employeeId === selectedEmployeeId) || (r.employee && r.employee.id === selectedEmployeeId)
                    if (!empMatch) return false
                  }
                  if (selectedDate) {
                    const dateStr = (() => {
                      if (r.timestamp) return new Date(r.timestamp).toISOString().slice(0,10)
                      const rt = reportTimes(r)
                      const d = rt.start || rt.end || null
                      return d ? new Date(d).toISOString().slice(0,10) : null
                    })()
                    if (!dateStr || dateStr !== selectedDate) return false
                  }
                  return true
                })
                .map(r => {
                const times = reportTimes(r)
                const start = times.start ? new Date(times.start) : null
                const end = times.end ? new Date(times.end) : null
                const duration = r.durationMin ? `${r.durationMin}m` : (start && end ? `${Math.round((end - start)/60000)}m` : '—')
                const keys = (r.items || r.keys || [])
                return (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-3 align-middle text-[13px] text-slate-700">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="px-3 py-3 align-middle">
                    <div className="font-medium text-sm">{r.employee?.name || '—'}</div>
                    <div className="text-[12px] text-slate-400">{r.employee?.position || ''}</div>
                  </td>
                  <td className="px-3 py-3 align-middle text-sm text-slate-700">{r.turn?.name || '—'}</td>
                  <td className="px-3 py-3 align-middle text-sm text-slate-600">{start ? start.toLocaleTimeString() : '—'}</td>
                  <td className="px-3 py-3 align-middle text-sm text-slate-600">{end ? end.toLocaleTimeString() : '—'}</td>
                  <td className="px-3 py-3 align-middle text-sm text-slate-600">{duration}</td>
                  <td className="px-3 py-3 align-middle">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(keys || []).filter(k=>k.employeeId === (r.employee?.id || r.employeeId)).filter(k=>!k.closedAt).map(k => (
                          <div key={k.id} className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1 text-[11px] shadow-sm">
                            <div className="flex flex-col leading-tight">
                              <span className="font-semibold">{k.clave}</span>
                              {k.type === 'break_start' && k.meta?.breakType && (
                                <span className="text-[10px] text-slate-300">{k.meta.breakType}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-200">{new Date(k.createdAt).toLocaleTimeString()}</span>
                            <button onClick={()=>closeKey(k.id)} className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] hover:bg-white/20">Cerrar</button>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2 max-h-32 overflow-y-auto">
                        {((r.items || r.keys) || []).slice(-5).reverse().map(h => (
                          <div key={h.id} className="flex justify-between gap-3 border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                            <div className="text-xs">
                              <span className="font-semibold text-slate-800">{h.clave}</span>
                              <div className="text-[10px] uppercase tracking-wide text-slate-400">{h.type || 'clave'}</div>
                            </div>
                            <div className="text-[10px] text-right text-slate-500 space-y-0.5">
                              <div><span className="font-semibold text-slate-400">Inicio:{' '}</span>{new Date(h.createdAt).toLocaleString()}</div>
                              {h.closedAt ? (<div><span className="font-semibold text-slate-400">Fin:{' '}</span>{new Date(h.closedAt).toLocaleString()}</div>) : (<div className="flex items-center justify-end gap-1 text-amber-600"><span className="font-semibold text-[10px]">Abierto</span><span>• {new Date(h.createdAt).toLocaleTimeString()}</span></div>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle text-sm text-slate-700">
                    {editingReportId === r.id ? (
                      <div className="flex items-start gap-2">
                        <textarea value={editingNotes} onChange={e=>setEditingNotes(e.target.value)} className="w-60 rounded-md border border-slate-200 p-2 text-sm" />
                        <div className="flex flex-col gap-2">
                          <button onClick={saveEditNotes} className="rounded-md px-3 py-1 bg-blue-600 text-white text-sm">Guardar</button>
                          <button onClick={cancelEditNotes} className="rounded-md px-3 py-1 bg-gray-100 text-sm">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-700">{r.notes || '—'}</div>
                        <button onClick={()=>startEditNotes(r)} className="ml-3 text-xs text-blue-600">Editar</button>
                      </div>
                    )}
                  </td>
                  
                </tr>
              )})}
              {reports.filter(r => r.type === 'shift_report' || r.type === 'row_snapshot').length === 0 && (
                <tr><td colSpan={8} className="text-center text-sm text-slate-400 py-8">No hay turnos para mostrar</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
