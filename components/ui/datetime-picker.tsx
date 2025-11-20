'use client'

import * as React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
}

export function DateTimePicker({ value, onChange, placeholder }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value)
  const [open, setOpen] = React.useState(false)

  const presetTimes = [
    { label: '08:00', value: '08:00' },
    { label: '10:00', value: '10:00' },
    { label: '12:00', value: '12:00' },
    { label: '14:00', value: '14:00' },
    { label: '16:00', value: '16:00' },
    { label: '18:00', value: '18:00' },
    { label: '20:00', value: '20:00' },
  ]

  const handlePresetClick = (presetTime: string) => {
    if (date) {
      const [hours, minutes] = presetTime.split(':')
      const newDate = new Date(date)
      newDate.setHours(parseInt(hours), parseInt(minutes))
      setDate(newDate)
      onChange(newDate)
      setOpen(false) // Fecha o popover
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal border-gray-300 hover:bg-white',
            !date && 'text-gray-500'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP 'às' HH:mm", { locale: ptBR })
          ) : (
            <span>{placeholder || 'Selecione data e hora'}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            locale={ptBR}
          />
          <div className="border-l border-gray-200 p-3 w-48">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horários sugeridos
              </label>
              <div className="space-y-1">
                {presetTimes.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetClick(preset.value)}
                    disabled={!date}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors',
                      !date && 'opacity-50 cursor-not-allowed',
                      date && 'hover:bg-[var(--color-clay-500)] hover:text-white'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
