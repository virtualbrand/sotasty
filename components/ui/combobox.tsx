"use client"

import * as React from "react"
import { Check, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"

export interface ComboboxOption {
  value: string
  label: string
  subtitle?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  onCreateNew?: (searchTerm: string) => void
  createNewLabel?: string
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione uma opção...",
  onCreateNew,
  createNewLabel = "Criar novo",
  disabled = false,
  loading = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((option) => option.value === value)

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    option.subtitle?.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setOpen(true)
      return
    }

    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          const option = filteredOptions[selectedIndex]
          onValueChange(option.value)
          setSearchValue(option.label)
          setOpen(false)
          setSelectedIndex(-1)
        } else if (searchValue && filteredOptions.length === 0 && onCreateNew) {
          setOpen(false)
          onCreateNew(searchValue)
          setSearchValue("")
        }
      } else if (e.key === 'Escape') {
        setOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
      }
    }
  }

  const handleClear = () => {
    setSearchValue("")
    onValueChange("")
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Atualiza searchValue quando há uma seleção
  React.useEffect(() => {
    if (selectedOption && !searchValue) {
      setSearchValue(selectedOption.label)
    }
  }, [selectedOption, searchValue])

  // Reset selected index when filtering changes
  React.useEffect(() => {
    setSelectedIndex(-1)
  }, [searchValue])

  // Fecha ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSelectedIndex(-1)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={(e) => {
          setSearchValue(e.target.value)
          if (!open) setOpen(true)
          if (value) onValueChange("") // Limpa seleção ao digitar
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={loading ? "Carregando..." : placeholder}
        disabled={disabled || loading}
        className={cn(
          "w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-white",
          "focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent",
          "hover:border-gray-400 transition-colors",
          "disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
          "text-gray-900 placeholder:text-gray-500",
          className
        )}
      />
      {searchValue && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            tabIndex={-1}
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}

      {open && (
        <div 
          className="absolute z-50 mt-1 w-full"
        >
          <div className="border border-gray-300 rounded-lg bg-white shadow-lg">
            <Command shouldFilter={false}>
              <CommandList>
                {filteredOptions.length > 0 ? (
                  <CommandGroup>
                    {filteredOptions.map((option, index) => (
                      <div
                        key={option.value}
                        onClick={() => {
                          onValueChange(option.value)
                          setSearchValue(option.label)
                          setOpen(false)
                          setSelectedIndex(-1)
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none transition-colors",
                          selectedIndex === index ? "bg-gray-100" : "hover:bg-gray-50",
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-gray-700",
                            value === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="truncate text-gray-900 font-medium">{option.label}</span>
                          {option.subtitle && (
                            <span className="text-xs text-gray-600 truncate">
                              {option.subtitle}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CommandGroup>
                ) : null}
                {onCreateNew && (
                  <>
                    {filteredOptions.length > 0 && <div className="border-t my-1" />}
                    <CommandGroup>
                      <div
                        onClick={() => {
                          setOpen(false)
                          setSearchValue("")
                          setSelectedIndex(-1)
                          onCreateNew(searchValue)
                        }}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none transition-colors hover:bg-gray-50 text-[var(--color-clay-500)]"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="font-medium">{createNewLabel}</span>
                      </div>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </div>
        </div>
      )}
    </div>
  )
}
