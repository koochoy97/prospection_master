import React from 'react'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { STATUS_OPTIONS } from '../constants/sheet'

export default function SheetTable({ columns, rows, loading, onCellChange, onCellBlur, selectedIds = new Set(), onToggleRow, onToggleAll, disableSelection = false, sort, onToggleSort, pending = new Set(), notify }) {
  // Track value at focus-time per cell to decide if blur should trigger save
  const focusValuesRef = React.useRef(new Map())
  const setFocusVal = (rowId, key, val) => {
    focusValuesRef.current.set(`${rowId}:${key}`, val ?? '')
  }
  const changedSinceFocus = (rowId, key, val) => {
    const start = focusValuesRef.current.get(`${rowId}:${key}`)
    return (start ?? '') !== (val ?? '')
  }
  const allSelected = rows.length > 0 && rows.every(r => selectedIds.has(r.id))
  return (
    <div className="table-wrap">
      <table className="sheet-table">
        <colgroup>
          <col className={`col-select`} />
          {columns.map(c => (<col key={c.key} className={`col-${c.key}`} />))}
        </colgroup>
        <thead>
          <tr>
            <th>
              <div className="select-cell" onClick={() => !disableSelection && onToggleAll && onToggleAll()}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => !disableSelection && onToggleAll && onToggleAll()}
                  onClick={(e)=>{ e.stopPropagation() }}
                  disabled={disableSelection}
                />
              </div>
            </th>
            {columns.map(c => {
              const is = sort?.key === c.key
              const dir = is ? sort?.dir : null
              return (
                <th key={c.key} className={`col-${c.key}`}>
                  <button type="button" className="th-sort" onClick={() => onToggleSort && onToggleSort(c.key)}>
                    <span>{c.label}</span>
                    <span className={`sort-icon ${is ? `is-sorted ${dir}` : ''}`} aria-hidden>
                      <span className="up">▲</span>
                      <span className="down">▼</span>
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({length: 8}).map((_,i)=> (
              <tr key={`sk${i}`}>
                <td className="select-cell"><div className="skeleton skeleton-box" style={{width: 20, height: 20, margin: '0 auto'}} /></td>
                {columns.map(c => (
                  <td key={c.key}><div className={c.key==='status' ? 'skeleton skeleton-pill' : 'skeleton skeleton-line'} /></td>
                ))}
              </tr>
            ))
          ) : (
            rows.map(row => (
              <tr key={row.id} className={selectedIds.has(row.id) ? 'row-selected' : ''}>
                <td className="select-cell" onClick={() => !disableSelection && onToggleRow && onToggleRow(row.id)}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => !disableSelection && onToggleRow && onToggleRow(row.id)}
                    onClick={(e)=>{ e.stopPropagation() }}
                    disabled={disableSelection}
                  />
                </td>
          {columns.map(col => {
            const hl = highlightClassFor(col.key, row)
            return (
              <td key={col.key} className={`${hl} col-${col.key}`}>
                {renderCell(row, col, onCellChange, onCellBlur, pending, setFocusVal, changedSinceFocus, notify)}
              </td>
            )
          })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function renderCell(row, col, onCellChange, onCellBlur, pending, setFocusVal, changedSinceFocus, notify) {
  const change = (val) => onCellChange(row.id, col.key, val)
  const isPending = pending.has(`${row.id}:${col.key}`)
  const wrap = (child) => (
    <div className="field-wrap">
      {child}
      {isPending && <div className="field-spinner" />}
    </div>
  )
  switch (col.key) {
    case 'ultima_humanizacion': {
      const p = splitDateParts(row.ultima_humanizacion)
      const text = p ? `${p.dd}/${p.mm}/${p.yy} ${p.hh}:${p.min}` : ''
      return (
        <div className="field-wrap">
          <span>{text}</span>
        </div>
      )
    }
    case 'ultimo_envio_reply': {
      const p = splitDateParts(row.ultimo_envio_reply)
      const text = p ? `${p.dd}/${p.mm}/${p.yy} ${p.hh}:${p.min}` : ''
      return (
        <div className="field-wrap">
          <span>{text}</span>
        </div>
      )
    }
    case 'sheet':
      return (
        <div className="field-wrap">
          {row.sheet ? (
            <a href={row.sheet} target="_blank" rel="noreferrer" className="link">Link</a>
          ) : null}
        </div>
      )
    case 'api_key': {
      const onCopy = async () => {
        try {
          if (!row.api_key) return
          await navigator.clipboard.writeText(String(row.api_key))
          if (typeof notify === 'function') notify('API Key copiada')
        } catch {}
      }
      return (
        <div className="field-wrap">
          <button type="button" className="tag tag-copy" onClick={onCopy} title="Copiar API Key">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span className="ellipsize">{row.api_key || ''}</span>
          </button>
        </div>
      )
    }
    default:
      return wrap(
        <Input
          value={row[col.key] || ''}
          onChange={e => change(e.target.value)}
          onFocus={e => setFocusVal(row.id, col.key, e.target.value)}
          onBlur={e => { const v = e.target.value; if (onCellBlur && changedSinceFocus(row.id, col.key, v)) onCellBlur(row.id, col.key, v) }}
          placeholder=""
        />
      )
  }
}

function splitDateParts(val) {
  if (!val) return null
  const s = String(val)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?(?:([+-]\d{2}:\d{2}|Z).*)?$/)
  if (!m) return null
  const [, yyyy, mm, dd, hh, min, tz] = m
  const tzMin = parseTzMinutes(tz)
  return { yyyy, yy: yyyy.slice(-2), mm, dd, hh, min, tzMin }
}

function parseTzMinutes(tz) {
  if (!tz || tz === 'Z') return 0
  const m = tz.match(/^([+-])(\d{2}):(\d{2})$/)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  const hh = Number(m[2]) || 0
  const mm = Number(m[3]) || 0
  return sign * (hh * 60 + mm)
}

function ymdForNowInTz(tzMin, dayOffset = 0) {
  const now = Date.now()
  const ms = now + tzMin * 60_000 + dayOffset * 24 * 60 * 60 * 1000
  const d = new Date(ms)
  // use UTC getters after applying tz offset to avoid local tz
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function highlightClassFor(colKey, row) {
  if (colKey !== 'ultima_humanizacion' && colKey !== 'ultimo_envio_reply') return ''
  const p = splitDateParts(row[colKey])
  if (!p) return ''
  const ymd = `${p.yyyy}-${p.mm}-${p.dd}`
  const today = ymdForNowInTz(p.tzMin, 0)
  const yest = ymdForNowInTz(p.tzMin, -1)
  if (ymd === today) return 'cell-today'
  if (ymd === yest) return 'cell-yesterday'
  return ''
}
