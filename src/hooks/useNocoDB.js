import { useEffect, useMemo, useState } from 'react'
import { buildNocoUrl, mapRecordToRow, updateNocoRecord } from '../services/nocodb'

export function useNocoDB({ baseUrl, viewId, ALL }) {
  const token = import.meta.env.VITE_NOCODB_TOKEN
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(!!token)
  const [error, setError] = useState(null)
  const [clientFilter, setClientFilter] = useState(ALL)
  const [allClients, setAllClients] = useState([])
  const [pending, setPending] = useState(new Set())
  // pending updates removed per request

  useEffect(() => {
    if (!token) { setLoading(false); return }
    const controller = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const url = buildNocoUrl(baseUrl, { clientFilter, ALL, viewId })
        // Debug: log full GET request details
        console.log('[NocoDB][GET] url', url.toString(), {
          params: Object.fromEntries(url.searchParams.entries()),
          headers: { 'xc-token': token ? token.slice(0,4) + '...' : 'missing' }
        })
        const res = await fetch(url.toString(), { headers: { 'xc-token': token }, signal: controller.signal })
        console.log('[NocoDB][GET] status', res.status, 'ok', res.ok)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json().catch(() => ({}))
        console.log('[NocoDB][GET] response', data)
        const list = Array.isArray(data) ? (data[0]?.list || []) : (data?.list || [])
        const mapped = (list || []).map(mapRecordToRow)
        setRows(mapped)
        if (clientFilter === ALL) {
          const s = new Set()
          for (const r of mapped) if (r.cliente) s.add(r.cliente)
          setAllClients(Array.from(s).sort((a,b)=>a.localeCompare(b)))
        }
      } catch (e) {
        setError(e)
        setRows([])
      } finally { setLoading(false) }
    }
    load()
    return () => controller.abort()
  }, [baseUrl, viewId, clientFilter, token, ALL])

  const clients = useMemo(() => (allClients.length ? allClients : Array.from(new Set(rows.map(r=>r.cliente).filter(Boolean))).sort((a,b)=>a.localeCompare(b))), [allClients, rows])

  // Always fetch full clients list once (ignoring clientFilter) so the dropdown has all options even when a param is applied
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    const loadClients = async () => {
      try {
        const url = buildNocoUrl(baseUrl, { clientFilter: ALL, ALL, viewId })
        const res = await fetch(url.toString(), { headers: { 'xc-token': token }, signal: controller.signal })
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        const list = Array.isArray(data) ? (data[0]?.list || []) : (data?.list || [])
        const s = new Set()
        for (const rec of list) if (rec.client) s.add(rec.client)
        const options = Array.from(s).sort((a,b)=>a.localeCompare(b))
        if (options.length) setAllClients(options)
      } catch {}
    }
    loadClients()
    return () => controller.abort()
  }, [baseUrl, viewId, token, ALL])

  return {
    rows,
    setRows,
    loading,
    error,
    clients,
    clientFilter,
    setClientFilter,
    pending,
    async updateRemoteCell(id, key, value) {
      try {
        const row = rows.find(r => r.id === id)
        if (!row || !row.recordId) return { ok: false, error: new Error('Registro sin id remoto') }
        const token = import.meta.env.VITE_NOCODB_TOKEN
        if (!token) return { ok: false, error: new Error('Token ausente') }
        const map = {
          sdr: 'sdr',
          pais: 'pais',
          sheet_name: 'sheet_name',
          spreadsheet_id: 'spreadsheet_id',
          hora_programada: 'hora_programada',
          ultima_humanizacion: 'ultima_humanizacion',
          ultimo_envio_reply: 'ultimo_envio_reply',
          margen_min: 'margen_min',
          activo: 'activo',
          comentario: 'comentario',
          status_sin_humanizar: 'status_sin_humanizar',
          status_humanizado: 'status_humanizado',
          upload_catch_all: 'upload_catch_all',
          sheet: 'sheet',
          api_key: 'api_key',
        }
        const apiKey = map[key]
        if (!apiKey) return { ok: false, error: new Error('Campo no mapeado') }
        // mark pending for UI spinner
        const pkey = `${id}:${key}`
        setPending(prev => new Set(prev).add(pkey))
        const payload = { [apiKey]: value }
        console.log('[NocoDB][BLUR PATCH] request', {
          tableUrl: baseUrl,
          recordId: row.recordId,
          payload,
          headers: { 'xc-token': token ? token.slice(0,4) + '...' : 'missing' }
        })
        const data = await updateNocoRecord(baseUrl, token, row.recordId, payload)
        console.log('[NocoDB][BLUR PATCH] response', data)
        return { ok: true, data }
      } catch (e) {
        console.warn('[NocoDB][BLUR PATCH] error', e)
        return { ok: false, error: e }
      }
      finally {
        setPending(prev => { const next = new Set(prev); next.delete(`${id}:${key}`); return next })
      }
    },
  }
}
