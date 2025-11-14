"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import { useState } from "react"
import { DateRange } from "react-day-picker"

interface CalendarWithRangePresetsProps {
  onDateChange?: (date: DateRange | undefined) => void
  defaultDate?: DateRange
}

export function CalendarWithRangePresets({ onDateChange, defaultDate }: CalendarWithRangePresetsProps) {
  const today = new Date()
  
  const yesterday = {
    from: subDays(today, 1),
    to: subDays(today, 1),
  }
  const last7Days = {
    from: subDays(today, 6),
    to: today,
  }
  const last30Days = {
    from: subDays(today, 29),
    to: today,
  }
  const monthToDate = {
    from: startOfMonth(today),
    to: today,
  }
  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  }
  const yearToDate = {
    from: startOfYear(today),
    to: today,
  }
  const lastYear = {
    from: startOfYear(subYears(today, 1)),
    to: endOfYear(subYears(today, 1)),
  }
  
  const [month, setMonth] = useState(today)
  const [date, setDate] = useState<DateRange | undefined>(defaultDate || last7Days)

  const handleDateSelect = (newDate: DateRange | undefined) => {
    setDate(newDate)
    onDateChange?.(newDate)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="flex max-sm:flex-col">
        <div className="relative border-gray-200 py-4 max-sm:order-1 max-sm:border-t sm:w-40">
          <div className="h-full border-gray-200 sm:border-e">
            <div className="flex flex-col px-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm hover:bg-gray-100"
                onClick={() => {
                  const newDate = {
                    from: today,
                    to: today,
                  }
                  handleDateSelect(newDate)
                  setMonth(today)
                }}
              >
                Hoje
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm hover:bg-gray-100"
                onClick={() => {
                  handleDateSelect(yesterday)
                  setMonth(yesterday.to)
                }}
              >
                Ontem
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm hover:bg-gray-100"
                onClick={() => {
                  handleDateSelect(last7Days)
                  setMonth(last7Days.to)
                }}
              >
                Últimos 7 dias
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm hover:bg-gray-100"
                onClick={() => {
                  handleDateSelect(last30Days)
                  setMonth(last30Days.to)
                }}
              >
                Últimos 30 dias
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm hover:bg-gray-100"
                onClick={() => {
                  handleDateSelect(monthToDate)
                  setMonth(monthToDate.to)
                }}
              >
                Mês atual
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm hover:bg-gray-100"
                onClick={() => {
                  handleDateSelect(lastMonth)
                  setMonth(lastMonth.to)
                }}
              >
                Mês passado
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm hover:bg-gray-100"
                onClick={() => {
                  handleDateSelect(yearToDate)
                  setMonth(yearToDate.to)
                }}
              >
                Ano atual
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm hover:bg-gray-100"
                onClick={() => {
                  handleDateSelect(lastYear)
                  setMonth(lastYear.to)
                }}
              >
                Ano passado
              </Button>
            </div>
          </div>
        </div>
        <Calendar
          mode="range"
          selected={date}
          onSelect={handleDateSelect}
          month={month}
          onMonthChange={setMonth}
          className="p-2 bg-white"
          disabled={[
            { after: today },
          ]}
        />
      </div>
    </div>
  )
}
