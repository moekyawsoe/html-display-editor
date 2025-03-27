"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload } from "lucide-react"
import { CodeEditor } from "./code-editor"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (elements: any[]) => void
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [importFormat, setImportFormat] = useState<"json" | "yaml">("json")
  const [importText, setImportText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [importMethod, setImportMethod] = useState<"text" | "file">("text")
  const fileInputRef = useState<HTMLInputElement | null>(null)

  const handleImport = () => {
    try {
      setError(null)
      let parsedData: any[] = []

      if (importFormat === "json") {
        parsedData = parseJsonData(importText)
      } else {
        parsedData = parseYamlData(importText)
      }

      if (Array.isArray(parsedData) && parsedData.length > 0) {
        onImport(parsedData)
        onOpenChange(false)
        setImportText("")
      } else {
        setError("Invalid data format. Please check your input.")
      }
    } catch (err) {
      setError(`Error parsing ${importFormat.toUpperCase()}: ${(err as Error).message}`)
    }
  }

  const parseJsonData = (jsonText: string) => {
    const data = JSON.parse(jsonText)
    return Array.isArray(data) ? data : [data]
  }

  const parseYamlData = (yamlText: string) => {
    // Simple YAML parser for the specific format
    const elements: any[] = []
    const lines = yamlText.split("\n")
    let currentElement: any = null
    let currentSection = ""
    let currentSubSection = ""
    let currentLanguage = ""

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip empty lines
      if (!line) continue

      // New element
      if (line.startsWith("- element_")) {
        if (currentElement) {
          elements.push(currentElement)
        }
        currentElement = {
          text: {},
          style: {},
        }
        currentSection = ""
        continue
      }

      // Element properties
      if (line.match(/^\s*name:/)) {
        currentElement.name = line.split(":")[1].trim().replace(/"/g, "")
        continue
      }

      if (line.match(/^\s*editable:/)) {
        currentElement.editable = line.split(":")[1].trim() === "true"
        continue
      }

      // Text section
      if (line.match(/^\s*text:/)) {
        currentSection = "text"
        continue
      }

      // Style section
      if (line.match(/^\s*style:/)) {
        currentSection = "style"
        continue
      }

      // Language in text section
      if (currentSection === "text" && line.match(/^\s*[a-z]{2}:/)) {
        currentLanguage = line.trim().split(":")[0]
        currentElement.text[currentLanguage] = { style: {} }
        currentSubSection = ""
        continue
      }

      // Text content
      if (currentSection === "text" && currentLanguage && line.match(/^\s*text:/)) {
        const textValue = line.split(":")[1].trim().replace(/^"/, "").replace(/"$/, "")
        currentElement.text[currentLanguage].text = textValue
        continue
      }

      // Text style subsection
      if (currentSection === "text" && currentLanguage && line.match(/^\s*style:/)) {
        currentSubSection = "style"
        continue
      }

      // Text style properties
      if (currentSection === "text" && currentSubSection === "style" && currentLanguage) {
        const [key, value] = line.trim().split(":")
        if (key && value) {
          currentElement.text[currentLanguage].style[key.trim()] = value.trim().replace(/^"/, "").replace(/"$/, "")
        }
        continue
      }

      // Style properties
      if (currentSection === "style") {
        const [key, value] = line.trim().split(":")
        if (key && value) {
          currentElement.style[key.trim()] = value.trim()
        }
        continue
      }
    }

    // Add the last element
    if (currentElement) {
      elements.push(currentElement)
    }

    return elements
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setImportText(event.target.result as string)
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Template</DialogTitle>
        </DialogHeader>

        <Tabs value={importMethod} onValueChange={(value) => setImportMethod(value as "text" | "file")}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="text">Paste Code</TabsTrigger>
            <TabsTrigger value="file">Upload File</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Tabs value={importFormat} onValueChange={(value) => setImportFormat(value as "json" | "yaml")}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="json">JSON</TabsTrigger>
                  <TabsTrigger value="yaml">YAML</TabsTrigger>
                </TabsList>

                <TabsContent value="json">
                  <CodeEditor code={importText} onChange={setImportText} language="json" />
                </TabsContent>

                <TabsContent value="yaml">
                  <CodeEditor code={importText} onChange={setImportText} language="yaml" />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-lg p-8">
              <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="mb-4 text-center text-muted-foreground">Upload a JSON or YAML template file</p>
              <Button onClick={() => document.getElementById("import-file")?.click()}>Select File</Button>
              <input
                id="import-file"
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!importText.trim()}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

