import React, { useLayoutEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

export const Textarea = React.forwardRef(({ className, autosize = true, rows = 1, value, onChange, ...props }, ref) => {
  const innerRef = useRef(null)
  const mergedRef = (node) => {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  useLayoutEffect(() => {
    if (!autosize || !innerRef.current) return
    const el = innerRef.current
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value, autosize])

  return (
    <textarea
      ref={mergedRef}
      rows={rows}
      value={value}
      onChange={onChange}
      className={cn(
        'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y leading-5 overflow-hidden',
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'
