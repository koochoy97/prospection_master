import React from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Checkbox({ checked = false, indeterminate = false, onChange, title, className }) {
  const isChecked = !!checked
  const isInd = !!indeterminate && !isChecked
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isInd ? 'mixed' : isChecked}
      title={title}
      onClick={(e) => { e.stopPropagation(); onChange?.(!isChecked) }}
      className={cn(
        'fake-checkbox inline-flex h-5 w-5 items-center justify-center rounded border-2 border-gray-400 bg-white text-white shadow hover:ring-2 hover:ring-blue-200',
        isChecked && 'bg-blue-600 border-blue-600 hover:ring-blue-300',
        isInd && 'bg-gray-500 border-gray-500 hover:ring-gray-300',
        className
      )}
    >
      {isChecked && <Check className="h-4 w-4" />}
      {isInd && !isChecked && <Minus className="h-4 w-4" />}
    </button>
  )}
