"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface CodeEditorProps {
  code: string
  language?: string
  onChange?: (code: string) => void
  readOnly?: boolean
}

export function CodeEditor({ code: initialCode, language = "html", onChange, readOnly = false }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCode(initialCode)
  }, [initialCode])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    onChange?.(newCode)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="relative rounded-md border bg-muted">
        <div className="flex items-center justify-between border-b bg-muted px-4 py-1.5">
          <span className="text-xs font-medium">{language.toUpperCase()}</span>
        </div>
        <textarea
          value={code}
          onChange={handleChange}
          className="block w-full resize-none bg-background p-4 font-mono text-sm focus:outline-none"
          style={{
            minHeight: "300px",
            maxHeight: "500px",
            whiteSpace: "pre",
            overflowWrap: "normal",
            overflowX: "auto",
          }}
          readOnly={readOnly}
          spellCheck="false"
        />
      </div>
    </div>
  )
}

