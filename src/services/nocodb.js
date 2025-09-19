export function buildNocoUrl(baseUrl, { clientFilter, ALL, viewId }) {
  const u = new URL(baseUrl)
  // Per request: remove all params and only keep limit
  u.searchParams.set('limit', '500')
  return u
}

export function mapRecordToRow(rec) {
  return {
    id: `api_${(rec?.id ?? rec?.Id ?? cryptoRandom())}`,
    recordId: (rec?.id ?? rec?.Id ?? null),
    sdr: rec.sdr ?? '',
    pais: rec.pais ?? '',
    sheet_name: rec.sheet_name ?? '',
    spreadsheet_id: rec.spreadsheet_id ?? '',
    hora_programada: rec.hora_programada ?? '',
    ultima_humanizacion: rec.ultima_humanizacion ?? '',
    ultimo_envio_reply: rec.ultimo_envio_reply ?? '',
    margen_min: rec.margen_min ?? '',
    activo: typeof rec.activo === 'boolean' ? rec.activo : Boolean(rec.activo),
    comentario: rec.comentario ?? '',
    status_sin_humanizar: rec.status_sin_humanizar ?? '',
    status_humanizado: rec.status_humanizado ?? '',
    upload_catch_all: typeof rec.upload_catch_all === 'boolean' ? rec.upload_catch_all : Boolean(rec.upload_catch_all),
    sheet: rec.sheet ?? '',
    api_key: rec.api_key ?? '',
  }
}

function cryptoRandom() {
  try {
    return Math.random().toString(36).slice(2, 10)
  } catch {
    return Date.now().toString(36)
  }
}

export async function updateNocoRecord(baseUrl, token, recordId, payload, signal) {
  // NocoDB v2 PATCH: /api/v2/tables/{tableId}/records with body [{ Id, ...fields }]
  const m = /tables\/([^/]+)\/records/.exec(baseUrl)
  const tableId = m ? m[1] : null
  if (!tableId || recordId == null) throw new Error('Missing tableId or recordId')
  const u = new URL(baseUrl)
  u.pathname = `/api/v2/tables/${tableId}/records`
  const body = [{ id: typeof recordId === 'string' ? Number(recordId) : recordId, ...payload }]

  // Debug
  console.log('[NocoDB][PATCH]', u.toString(), body, {
    headers: { 'Content-Type': 'application/json', 'xc-token': token ? token.slice(0,4)+'...' : 'missing' },
    method: 'PATCH'
  })

  const res = await fetch(u.toString(), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'xc-token': token },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) throw new Error(`Update failed HTTP ${res.status}`)
  return res.json().catch(() => ({}))
}

export async function createNocoRecord(baseUrl, token, payload, signal) {
  // POST /api/v2/tables/{tableId}/records with object payload
  const m = /tables\/([^/]+)\/records/.exec(baseUrl)
  const tableId = m ? m[1] : null
  if (!tableId) throw new Error('Missing tableId')
  const u = new URL(baseUrl)
  u.pathname = `/api/v2/tables/${tableId}/records`
  console.log('[NocoDB][CREATE] POST', u.toString(), payload, {
    headers: { 'Content-Type': 'application/json', 'xc-token': token ? token.slice(0,4)+'...' : 'missing' }
  })
  const res = await fetch(u.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'xc-token': token },
    body: JSON.stringify(payload),
    signal,
  })
  console.log('[NocoDB][CREATE] status', res.status)
  if (!res.ok) throw new Error(`Create failed HTTP ${res.status}`)
  const data = await res.json().catch(() => ({}))
  console.log('[NocoDB][CREATE] response', data)
  // Response can be object or array; normalize to first object
  const rec = Array.isArray(data) ? data[0] : data
  return rec
}
