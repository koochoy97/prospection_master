import React from 'react'
import { cn } from '../../lib/utils'

// shadcn-like button variants using CSS tokens defined in styles.css
const variants = {
  // Primary button
  default: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90',
  // Subtle alternative
  secondary: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80',
  // Outline
  outline: 'border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
  // Destructive (red)
  destructive: 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90',
  // Ghost
  ghost: 'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]'
}

export function Button({ className, variant = 'default', asChild = false, ...props }) {
  const Comp = asChild ? 'span' : 'button'
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  )
}
