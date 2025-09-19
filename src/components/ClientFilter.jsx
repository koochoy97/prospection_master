import React from 'react'

export default function ClientFilter({ value, options = [], onChange, allLabel = 'Todos los clientes', disabled = false, large = false }) {
  const labelStyle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: large ? 18 : undefined }
  const selectStyle = large ? { fontSize: 18, padding: '8px 10px' } : undefined
  return (
    <label style={labelStyle}>
      <span style={{fontWeight:700}}>Cliente:</span>
      <select
        className="client-title-trigger"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={selectStyle}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt === '__ALL__' ? allLabel : opt}</option>
        ))}
      </select>
    </label>
  )
}
