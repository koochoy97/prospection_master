import React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import SheetTable from './SheetTable'
import { useNocoDB } from '../hooks/useNocoDB'
import { COLUMNS as columns, ALL_CLIENTS } from '../constants/sheet'
import { createNocoRecord, mapRecordToRow } from '../services/nocodb'
import CreateSlide from './CreateSlide'

const newId = () => `${Date.now()}_${Math.random().toString(36).slice(2,8)}`

function toCSV(rows) {
  const header = columns.map(c => c.label)
  const lines = [header]
  for (const r of rows) {
    const vals = columns.map(c => {
      const v = r[c.key] ?? ''
      const s = String(v)
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return '"' + s.replaceAll('"', '""') + '"'
      }
      return s
    })
    lines.push(vals)
  }
  return lines.map(a => a.join(',')).join('\n')
}

export default function Sheet() {
  const NOCO_BASE_URL = import.meta.env.VITE_NOCODB_BASE_URL || 'https://nocodb.wearesiete.com/api/v2/tables/mijlh8ec9t918z1/records'
  const NOCO_VIEW_ID = import.meta.env.VITE_NOCODB_VIEW_ID || 'vwfm12c1zcx2d179'
  const { rows, setRows, loading, updateRemoteCell, pending } = useNocoDB({
    baseUrl: NOCO_BASE_URL,
    viewId: NOCO_VIEW_ID,
    ALL: ALL_CLIENTS,
  })

  const [selectedIds, setSelectedIds] = React.useState(new Set())
  const [selectionLocked, setSelectionLocked] = React.useState(false)
  // Default client-side sort: celebration date (fecha) descending (newest first)
  const [sort, setSort] = React.useState({ key: 'ultima_humanizacion', dir: 'desc' }) // dir: 'asc' | 'desc' | null
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createSaving, setCreateSaving] = React.useState(false)
  const [createForm, setCreateForm] = React.useState({
    company: '', fecha: '', status: '', kdm: '', tituloKdm: '', industria: '', empleados: '', score: '', feedback: '', cliente: ''
  })
  // Búsqueda
  const [companyQuery, setCompanyQuery] = React.useState('')
  const toggleRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    setSelectedIds(prev => {
      if (!rows.length) return new Set()
      const allSelected = rows.every(r => prev.has(r.id))
      if (allSelected) return new Set()
      const next = new Set(rows.map(r => r.id))
      return next
    })
  }

  const openDuplicate = () => {
    if (selectedIds.size !== 1) return
    const id = Array.from(selectedIds)[0]
    const row = rows.find(r => r.id === id)
    if (!row) return
    setCreateForm({
      company: row.company || '',
      fecha: row.fecha || '',
      status: row.status || '',
      kdm: row.kdm || '',
      tituloKdm: row.tituloKdm || '',
      industria: row.industria || '',
      empleados: row.empleados || '',
      score: row.score === 0 ? 0 : (row.score || ''),
      feedback: row.feedback || '',
      cliente: (row.cliente || '')
    })
    // Keep current selection, but lock selection changes while the slider is open
    setSelectionLocked(true)
    setCreateOpen(true)
  }

  const addRow = () => {
    // Clear any selection and lock selection while creating
    if (selectedIds.size > 0) setSelectedIds(new Set())
    setSelectionLocked(true)
    // Open slide-over to create new record
    setCreateForm({ company: '', fecha: '', status: '', kdm: '', tituloKdm: '', industria: '', empleados: '', score: '', feedback: '', cliente: '' })
    setCreateOpen(true)
  }

  const updateCell = (id, key, value) => {
    const v = key === 'score' && value !== '' ? Number(value) : value
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: v } : r))
  }

  const downloadCSV = () => {
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'datos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const removeSelected = () => {
    setRows(prev => prev.filter(r => !selectedIds.has(r.id)))
    setSelectedIds(new Set())
  }

  const [manualPosting, setManualPosting] = React.useState(false)
  const handleManualStart = async () => {
    if (selectedIds.size < 1) return
    const ids = Array.from(selectedIds)
    const rowsById = new Map(rows.map(r => [r.id, r]))
    const webhook = 'https://n8n.wearesiete.com/webhook/88cc710b-55b7-4aa7-bed6-81485d8c4480'
    try {
      setManualPosting(true)
      const sleep = (ms) => new Promise(r => setTimeout(r, ms))
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i]
        const row = rowsById.get(id)
        if (!row) continue
        const payload = { spreadsheet_id: row.spreadsheet_id }
        console.log('[Manual][Start]', i + 1, '/', ids.length, 'payload =', payload)
        // Esperar 5s antes de cada envío
        await sleep(5000)
        try {
          const res = await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          console.log('[Manual][POST] status', res.status)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          enqueueToast(`Inicio manual enviado (${row.spreadsheet_id})`)
        } catch (e) {
          console.warn('[Manual][POST] error', e)
          enqueueToast(`Error al iniciar (${row.spreadsheet_id}): ${e.message}`)
        }
      }
    } finally {
      setManualPosting(false)
    }
  }

  // Toasts
  const [toasts, setToasts] = React.useState([])
  const enqueueToast = (msg) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000)
  }

  // Track last-saved values to avoid PATCH if unchanged
  const lastSaved = React.useRef(new Map())
  const normalize = React.useCallback((key, val) => {
    if (key === 'score') {
      if (val === '' || val === null || val === undefined) return ''
      const n = Number(val)
      return Number.isFinite(n) ? n : val
    }
    return (val ?? '').toString()
  }, [])
  const prevLoading = React.useRef(true)
  React.useEffect(() => {
    // Initialize snapshot only on transition loading: true -> false (post-fetch)
    if (prevLoading.current && !loading) {
      const snap = new Map()
      for (const r of rows) {
        for (const c of columns) {
          snap.set(`${r.id}:${c.key}`, normalize(c.key, r[c.key]))
        }
      }
      console.log('[snapshot] initialized with', snap.size, 'entries')
      lastSaved.current = snap
    }
    prevLoading.current = loading
  }, [loading, rows])

  // Filtro de clientes eliminado

  // Toasts removed per request

  return (
    <div className="sheet-root">
      <div className="sheet-headerbar" style={{marginBottom: 4, display:'flex', flexDirection:'column', gap:8}}>
        
        <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', justifyContent:'space-between', width:'100%'}}>
          <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
            <label style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontWeight:700}}>Buscar:</span>
              <Input placeholder="Buscar" style={{width:320}} value={companyQuery} onChange={e=>setCompanyQuery(e.target.value)} disabled={createOpen} />
            </label>
          </div>
          <div>
            <Button onClick={addRow} className="bg-black text-white hover:bg-neutral-900">Agregar fila</Button>
          </div>
        </div>
      </div>

      <div className="toolbar">
        {selectedIds.size >= 1 && (
          <Button variant="default" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleManualStart} disabled={manualPosting}>
            Iniciar manualmente
          </Button>
        )}
      </div>

      <SheetTable
        columns={columns}
        rows={useSortedRows(useFilteredRows(rows, companyQuery), sort)}
        loading={loading}
        onCellChange={updateCell}
        onCellBlur={async (id, key, value) => {
          const mapKey = `${id}:${key}`
          const saved = lastSaved.current.get(mapKey)
          const normVal = normalize(key, value)
          if (saved === normVal) return // no cambios
          const res = await updateRemoteCell(id, key, value)
          if (res?.ok) {
            lastSaved.current.set(mapKey, normVal)
            enqueueToast(`Guardado OK (${key})`)
          } else {
            enqueueToast(`Error (${key}): ${res?.error?.message || 'fallo'}`)
          }
        }}
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        disableSelection={selectionLocked}
        sort={sort}
        onToggleSort={(key) => setSort(prev => {
          if (!prev.key || prev.key !== key) return { key, dir: 'asc' }
          if (prev.dir === 'asc') return { key, dir: 'desc' }
          return { key: null, dir: null }
        })}
        pending={pending}
        notify={enqueueToast}
      />
      <ToastContainer toasts={toasts} />

      {createOpen && (
        <CreateSlide
          values={createForm}
          onChange={(key, val) => setCreateForm(v => ({ ...v, [key]: val }))}
          onCancel={() => { setCreateOpen(false); setSelectionLocked(false) }}
          onSave={async () => {
            try {
              setCreateSaving(true)
              const token = import.meta.env.VITE_NOCODB_TOKEN
              const baseUrl = NOCO_BASE_URL
              const payload = {
                company: createForm.company,
                celebration_date: createForm.fecha,
                status: createForm.status,
                kdm: createForm.kdm,
                kdm_title: createForm.tituloKdm,
                industry: createForm.industria,
                employers_quantity: createForm.empleados,
                score: createForm.score === '' ? null : Number(createForm.score),
                feedback: createForm.feedback,
                client: createForm.cliente,
              }
              const rec = await createNocoRecord(baseUrl, token, payload)
              const merged = { ...(payload || {}), ...(rec || {}) }
              merged.Id = rec?.Id ?? rec?.id ?? merged.Id
              merged.id = rec?.id ?? rec?.Id ?? merged.id
              const row = mapRecordToRow(merged)
              setRows(prev => [row, ...prev])
              // clear any selection after successful create
              setSelectedIds(new Set())
              // update snapshot for new row
              const snap = lastSaved.current
              for (const c of columns) snap.set(`${row.id}:${c.key}`, row[c.key] ?? '')
              enqueueToast('Creado OK')
              setCreateOpen(false)
              setSelectionLocked(false)
            } catch (e) {
              enqueueToast(`Error al crear: ${e.message}`)
            } finally {
              setCreateSaving(false)
            }
          }}
          onSaveAnother={async () => {
            try {
              setCreateSaving(true)
              const token = import.meta.env.VITE_NOCODB_TOKEN
              const baseUrl = NOCO_BASE_URL
              const payload = {
                company: createForm.company,
                celebration_date: createForm.fecha,
                status: createForm.status,
                kdm: createForm.kdm,
                kdm_title: createForm.tituloKdm,
                industry: createForm.industria,
                employers_quantity: createForm.empleados,
                score: createForm.score === '' ? null : Number(createForm.score),
                feedback: createForm.feedback,
                client: createForm.cliente,
              }
              const rec = await createNocoRecord(baseUrl, token, payload)
              const merged = { ...(payload || {}), ...(rec || {}) }
              merged.Id = rec?.Id ?? rec?.id ?? merged.Id
              merged.id = rec?.id ?? rec?.Id ?? merged.id
              const row = mapRecordToRow(merged)
              setRows(prev => [row, ...prev])
              // clear any selection after successful create-another
              setSelectedIds(new Set())
              const snap = lastSaved.current
              for (const c of columns) snap.set(`${row.id}:${c.key}`, row[c.key] ?? '')
              enqueueToast('Creado OK')
              // reset form for next creation (preserve cliente)
              setCreateForm({ company: '', fecha: '', status: '', kdm: '', tituloKdm: '', industria: '', empleados: '', score: '', feedback: '', cliente: createForm.cliente })
            } catch (e) {
              enqueueToast(`Error al crear: ${e.message}`)
            } finally {
              setCreateSaving(false)
            }
          }}
          saving={createSaving}
        />
      )}
    </div>
  )
}

function useSortedRows(rows, sort) {
  return React.useMemo(() => {
    if (!sort?.key || !sort?.dir) return rows
    const { key, dir } = sort
    const copy = [...rows]
    copy.sort((a, b) => {
      let va = a[key]
      let vb = b[key]
      // handle numeric for score
      if (key === 'score') {
        va = Number.isFinite(va) ? va : -Infinity
        vb = Number.isFinite(vb) ? vb : -Infinity
        return (va - vb) * (dir === 'asc' ? 1 : -1)
      }
      // handle date-like strings (YYYY-MM-DD HH:mm...) and push empties to the end
      if (key === 'ultima_humanizacion' || key === 'ultimo_envio_reply') {
        const sa = (va ?? '').toString().trim()
        const sb = (vb ?? '').toString().trim()
        const aEmpty = sa === ''
        const bEmpty = sb === ''
        if (aEmpty && !bEmpty) return 1 // empties always last
        if (!aEmpty && bEmpty) return -1
        if (aEmpty && bEmpty) return 0
        const keyify = (s) => {
          const m = s.match(/^(\d{4})(\d{2})(\d{2})[ T]?(\d{2})(\d{2})|^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
          if (m) {
            // support both packed and dashed formats
            const parts = m[1] ? [m[1], m[2], m[3], m[4], m[5]] : [m[6], m[7], m[8], m[9], m[10]]
            return parts.join('')
          }
          return s
        }
        const ca = keyify(sa)
        const cb = keyify(sb)
        return ca.localeCompare(cb) * (dir === 'asc' ? 1 : -1)
      }
      // fecha stored as yyyy-MM-dd, lexicographic compare is fine
      const sa = (va ?? '').toString()
      const sb = (vb ?? '').toString()
      return sa.localeCompare(sb) * (dir === 'asc' ? 1 : -1)
    })
    return copy
  }, [rows, sort])
}

function useFilteredRows(rows, query) {
  return React.useMemo(() => {
    const raw = (query || '').trim()
    if (!raw) return rows
    const m = raw.match(/https?:\/\/docs\.google\.com\/spreadsheets\/d\/([^\/?#]+)/i)
    const needleId = m ? m[1] : raw
    const q = needleId.toLowerCase()
    const norm = (s) => (s ?? '').toString().toLowerCase()
    return rows.filter(r => {
      const sdr = norm(r.sdr)
      const pais = norm(r.pais)
      const sid = norm(r.spreadsheet_id)
      return sdr.includes(q) || pais.includes(q) || sid.includes(q)
    })
  }, [rows, query])
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.msg}</div>
      ))}
    </div>
  )
}

//

// CreateSlide moved to its own component
