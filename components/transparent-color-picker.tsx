"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TransparentColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function TransparentColorPicker({ color, onChange }: TransparentColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hexColor, setHexColor] = useState("#ffffff")
  const [alpha, setAlpha] = useState(100)

  // Parse the initial color on mount and when color prop changes
  useEffect(() => {
    if (color.startsWith("rgba")) {
      // Parse rgba format
      const match = color.match(/rgba$$(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)$$/)
      if (match) {
        const [, r, g, b, a] = match
        const hex = rgbToHex(Number.parseInt(r), Number.parseInt(g), Number.parseInt(b))
        setHexColor(hex)
        setAlpha(Number.parseFloat(a) * 100)
      }
    } else if (color.startsWith("#")) {
      // It's a hex color
      setHexColor(color)
      setAlpha(100)
    }
  }, [color])

  // Convert RGB to Hex
  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16)
          return hex.length === 1 ? "0" + hex : hex
        })
        .join("")
    )
  }

  // Convert Hex to RGBA
  const hexToRgba = (hex: string, alpha: number) => {
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`
  }

  // Update the color when hex or alpha changes
  const updateColor = (newHex: string, newAlpha: number) => {
    if (newAlpha < 100) {
      onChange(hexToRgba(newHex, newAlpha))
    } else {
      onChange(newHex)
    }
  }

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

  // Display color with transparency
  const displayColor = alpha < 100 ? hexToRgba(hexColor, alpha) : hexColor

  // Create a checkerboard background for transparency
  const transparencyBg = `
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%)
  `

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-md border"
              style={{
                backgroundImage: transparencyBg,
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
              }}
            >
              <div className="h-full w-full rounded-md" style={{ backgroundColor: displayColor }} />
            </div>
            <span>{displayColor}</span>
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
                  hexColor === presetColor && "ring-2 ring-primary ring-offset-2",
                )}
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  setHexColor(presetColor)
                  updateColor(presetColor, alpha)
                }}
                type="button"
              />
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-md border"
                style={{
                  backgroundImage: transparencyBg,
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                }}
              >
                <div className="h-full w-full rounded-md" style={{ backgroundColor: displayColor }} />
              </div>
              <Input
                id="color"
                value={hexColor}
                onChange={(e) => {
                  const newHex = e.target.value
                  setHexColor(newHex)
                  if (/^#[0-9A-F]{6}$/i.test(newHex)) {
                    updateColor(newHex, alpha)
                  }
                }}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transparency">Transparency: {alpha}%</Label>
            <Slider
              id="transparency"
              min={0}
              max={100}
              step={1}
              value={[alpha]}
              onValueChange={([value]) => {
                setAlpha(value)
                updateColor(hexColor, value)
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

