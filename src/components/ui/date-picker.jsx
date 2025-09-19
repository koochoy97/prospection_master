import React, { forwardRef, useMemo } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

function toDate(value) {
  if (!value) return null
  const d = parseISO(value)
  return isValid(d) ? d : null
}
function toStr(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const Trigger = forwardRef(({ onClick, placeholder, className = '', displayValue, ...rest }, ref) => {
  const label = displayValue ? format(displayValue, 'dd/MM/yyyy', { locale: es }) : placeholder
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={"flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 " + className}
      {...rest}
    >
      <span className={!displayValue ? 'text-gray-400' : ''}>{label}</span>
      <CalendarIcon className="h-4 w-4 opacity-60" />
    </button>
  )
})
Trigger.displayName = 'Trigger'

export default function DatePicker({ value, onChange, placeholder = 'Seleccionar', open, onOpenChange, inputProps = {} }) {
  const date = useMemo(() => toDate(value), [value])
  const controlled = typeof open === 'boolean'

  return (
    <ReactDatePicker
      selected={date}
      onChange={(d) => onChange(toStr(d))}
      locale={es}
      dateFormat="dd/MM/yyyy"
      popperPlacement="bottom-start"
      customInput={<Trigger placeholder={placeholder} displayValue={date} {...inputProps} />}
      open={controlled ? open : undefined}
      onCalendarOpen={() => onOpenChange?.(true)}
      onCalendarClose={() => onOpenChange?.(false)}
      onClickOutside={() => onOpenChange?.(false)}
      shouldCloseOnSelect
      placeholderText={placeholder}
      showPopperArrow={false}
      portalId="sheet-datepicker-portal"
    />
  )
}
