"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const presetColors = [
    "#f87171", // red
    "#fb923c", // orange
    "#fbbf24", // amber
    "#facc15", // yellow
    "#a3e635", // lime
    "#4ade80", // green
    "#34d399", // emerald
    "#2dd4bf", // teal
    "#22d3ee", // cyan
    "#38bdf8", // sky
    "#60a5fa", // blue
    "#818cf8", // indigo
    "#a78bfa", // violet
    "#c084fc", // purple
    "#e879f9", // fuchsia
    "#f472b6", // pink
    "#fb7185", // rose
    "#ffffff", // white
    "#d1d5db", // gray-300
    "#6b7280", // gray-500
    "#1f2937", // gray-800
    "#000000", // black
  ]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md border" style={{ backgroundColor: color }} />
            <span>{color}</span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                className={cn(
                  "h-6 w-6 rounded-md border",
                  color === presetColor && "ring-2 ring-primary ring-offset-2",
                )}
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  onChange(presetColor)
                  setIsOpen(false)
                }}
                type="button"
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md border" style={{ backgroundColor: color }} />
            <Input id="color" value={color} onChange={(e) => onChange(e.target.value)} className="flex-1" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

