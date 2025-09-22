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

function redactToken(token) {
  return token ? token.slice(0, 4) + '...' : 'missing'
}

// Generic helper to log every step of a NocoDB request and return parsed JSON
export async function fetchNocoJSON(url, { method = 'GET', token, headers = {}, body, signal, tag } = {}) {
  const href = typeof url === 'string' ? url : url.toString()
  const label = tag || method
  const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
  const logBase = `[NocoDB][${label}]`
  try {
    // Prepare headers (ensure Accept JSON; add token if present)
    const reqHeaders = { Accept: 'application/json', ...headers }
    if (token) reqHeaders['xc-token'] = token

    // Log request details
    console.log(`${logBase} request`, href, {
      method,
      headers: { ...reqHeaders, 'xc-token': redactToken(token) },
      body: body && typeof body !== 'string' ? body : body || undefined,
    })

    // Prepare body
    const reqBody = typeof body === 'string' || body == null ? body : JSON.stringify(body)

    const res = await fetch(href, { method, headers: reqHeaders, body: reqBody, signal })
    const duration = ((typeof performance !== 'undefined' && performance.now() ? performance.now() : Date.now()) - start)
    console.log(`${logBase} status`, res.status, 'ok', res.ok, `(${Math.round(duration)}ms)`) // status line

    let data = null
    try {
      data = await res.json()
      console.log(`${logBase} response`, data)
    } catch (e) {
      console.warn(`${logBase} response parse failed`, e?.message || e)
    }

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`)
      // Surface error payload for easier debugging
      err.payload = data
      throw err
    }

    return data
  } catch (e) {
    console.warn(`${logBase} error`, e)
    throw e
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

  const data = await fetchNocoJSON(u.toString(), {
    method: 'PATCH',
    token,
    headers: { 'Content-Type': 'application/json' },
    body,
    signal,
    tag: 'PATCH',
  })
  return data || {}
}

export async function createNocoRecord(baseUrl, token, payload, signal) {
  // POST /api/v2/tables/{tableId}/records with object payload
  const m = /tables\/([^/]+)\/records/.exec(baseUrl)
  const tableId = m ? m[1] : null
  if (!tableId) throw new Error('Missing tableId')
  const u = new URL(baseUrl)
  u.pathname = `/api/v2/tables/${tableId}/records`
  const data = await fetchNocoJSON(u.toString(), {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    signal,
    tag: 'CREATE'
  })
  // Response can be object or array; normalize to first object
  const rec = Array.isArray(data) ? data[0] : data
  return rec
}
