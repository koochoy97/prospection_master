import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { cn } from '../../lib/utils'
import 'react-day-picker/dist/style.css'

export function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-2', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4',
        month: 'space-y-2',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
        day_selected: 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white',
        day_today: 'bg-blue-100 text-blue-900',
        day_outside: 'text-gray-400 opacity-50',
        day_disabled: 'text-gray-400 opacity-50',
        day_range_middle: 'aria-selected:bg-blue-100 aria-selected:text-blue-900',
        day_hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  )
}

