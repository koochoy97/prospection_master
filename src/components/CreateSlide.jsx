import React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'

export default function CreateSlide({ values, onChange, onCancel, onSave, onSaveAnother, saving }) {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onEsc)
    const t = requestAnimationFrame(() => setOpen(true))
    return () => { document.removeEventListener('keydown', onEsc); cancelAnimationFrame(t) }
  }, [onCancel])
  const handleClose = () => {
    setOpen(false)
    // Espera a que termine la transición CSS (.28s)
    setTimeout(() => onCancel(), 300)
  }
  return (
    <>
      <div className={`slide-panel ${open ? 'open' : ''}`}>
        <div className="slide-header">
          <h3>Nuevo registro</h3>
          <button type="button" className="slide-close" aria-label="Cerrar" onClick={handleClose}>×</button>
        </div>
        <div className="slide-body">
          <label>Company
            <Input value={values.company} onChange={e => onChange('company', e.target.value)} />
          </label>
          <div className="field-group">
            <span className="field-label">Fecha de celebración</span>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              value={values.fecha}
              onChange={e => onChange('fecha', e.target.value)}
              onFocus={e => { if (e.target.showPicker) e.target.showPicker() }}
              onClick={e => { if (e.target.showPicker) e.target.showPicker() }}
            />
          </div>
          <label>Status
            <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900" value={values.status} onChange={e => onChange('status', e.target.value)}>
              <option value="">Seleccionar</option>
              {['Pendiente','En curso','Ganado','Perdido','Completada','No show','Reprogramada','Cancelada'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>KDM
            <Input value={values.kdm} onChange={e => onChange('kdm', e.target.value)} />
          </label>
          <label>Título del KDM
            <Input value={values.tituloKdm} onChange={e => onChange('tituloKdm', e.target.value)} />
          </label>
          <label>Industria
            <Textarea value={values.industria} onChange={e => onChange('industria', e.target.value)} rows={1} />
          </label>
          <label># Empleados
            <Input value={values.empleados} onChange={e => onChange('empleados', e.target.value)} />
          </label>
          <label>Score
            <Input type="number" value={values.score} onChange={e => onChange('score', e.target.value)} data-colkey="score" />
          </label>
          <label>Feedback
            <Textarea value={values.feedback} onChange={e => onChange('feedback', e.target.value)} rows={3} />
          </label>
        </div>
        <div className="slide-footer">
          <Button
            variant="default"
            className="bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/80"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button
            variant="default"
            className="bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/80"
            onClick={onSaveAnother}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar y crear otro'}
          </Button>
          <Button
            variant="default"
            className="bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-100/80"
            onClick={handleClose}
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </>
  )
}
