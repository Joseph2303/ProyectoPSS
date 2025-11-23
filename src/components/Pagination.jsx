import React, { useMemo } from 'react'

export default function Pagination({
  total = 0,
  page,
  setPage,
  pageSize,
  setPageSize,
  sizes = [10, 25, 50],
}) {
  const maxPages = Math.max(1, Math.ceil(total / pageSize))

  const pages = useMemo(() => {
    const out = []
    const start = Math.max(1, page - 2)
    const end = Math.min(maxPages, start + 4)
    for (let i = start; i <= end; i++) out.push(i)
    return out
  }, [page, maxPages])

  function go(p) {
    if (p < 1) p = 1
    if (p > maxPages) p = maxPages
    setPage(p)
  }

  return (
    <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100 bg-white">
      <div className="text-xs text-slate-600">
        Mostrando {total === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(total, page * pageSize)} de {total}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
          className="text-xs rounded-full border border-slate-200 px-2 py-1 bg-white"
        >
          {sizes.map(s => (
            <option key={s} value={s}>{s} / página</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => go(page - 1)}
            disabled={page <= 1}
            className="px-2 py-1 rounded-full bg-slate-50 text-xs text-slate-600 disabled:opacity-40"
          >
            ‹
          </button>

          {pages[0] > 1 && (
            <button onClick={() => go(1)} className="px-2 py-1 rounded-full text-xs bg-slate-50">1</button>
          )}

          {pages.map(p => (
            <button
              key={p}
              onClick={() => go(p)}
              className={
                'px-2 py-1 rounded-full text-xs ' +
                (p === page ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600')
              }
            >
              {p}
            </button>
          ))}

          {pages[pages.length - 1] < maxPages && (
            <button onClick={() => go(maxPages)} className="px-2 py-1 rounded-full text-xs bg-slate-50">{maxPages}</button>
          )}

          <button
            onClick={() => go(page + 1)}
            disabled={page >= maxPages}
            className="px-2 py-1 rounded-full bg-slate-50 text-xs text-slate-600 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
