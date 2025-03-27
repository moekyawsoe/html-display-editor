"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Image, Upload, Video } from "lucide-react"

export interface MediaItem {
  id: string
  type: "image" | "video"
  url: string
  name: string
}

interface MediaUploaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: MediaItem) => void
  mediaLibrary: MediaItem[]
  onUpload: (newMedia: MediaItem[]) => void
}

export function MediaUploader({ open, onOpenChange, onSelect, mediaLibrary, onUpload }: MediaUploaderProps) {
  const [activeTab, setActiveTab] = useState("library")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [externalUrl, setExternalUrl] = useState("")

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newMedia: MediaItem[] = []
    const progressUpdates: Record<string, number> = {}

    Array.from(files).forEach((file) => {
      const id = Math.random().toString(36).substring(2, 11)
      progressUpdates[id] = 0

      const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null

      if (!fileType) return

      const reader = new FileReader()

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress((prev) => ({ ...prev, [id]: progress }))
        }
      }

      reader.onload = (event) => {
        if (event.target?.result) {
          newMedia.push({
            id,
            type: fileType as "image" | "video",
            url: event.target.result as string,
            name: file.name,
          })

          // If all files are processed, update the media library
          if (newMedia.length === files.length) {
            onUpload(newMedia)
            setUploadProgress({})
          }
        }
      }

      reader.readAsDataURL(file)
    })

    setUploadProgress(progressUpdates)

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleExternalUrlSubmit = () => {
    if (!externalUrl) return

    // Simple validation for image URLs
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(externalUrl)
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(externalUrl)

    if (!isImage && !isVideo) {
      alert("Please enter a valid image or video URL")
      return
    }

    const newMedia: MediaItem = {
      id: Math.random().toString(36).substring(2, 11),
      type: isImage ? "image" : "video",
      url: externalUrl,
      name: externalUrl.split("/").pop() || "External media",
    }

    onUpload([newMedia])
    setExternalUrl("")
    setActiveTab("library")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="external">External URL</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="h-[400px] overflow-y-auto">
            {mediaLibrary.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                <Image className="h-12 w-12 mb-4 opacity-20" />
                <p>No media uploaded yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab("upload")}>
                  Upload Media
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {mediaLibrary.map((media) => (
                  <div
                    key={media.id}
                    className="border rounded-md p-2 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      onSelect(media)
                      onOpenChange(false)
                    }}
                  >
                    {media.type === "image" ? (
                      <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                        <img
                          src={media.url || "/placeholder.svg"}
                          alt={media.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                        <video src={media.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video className="h-8 w-8 text-white opacity-80" />
                        </div>
                      </div>
                    )}
                    <p className="mt-2 text-sm truncate">{media.name}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="h-[400px]">
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg p-8">
              <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="mb-4 text-center text-muted-foreground">
                Drag and drop files here, or click to select files
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>Select Files</Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*"
                className="hidden"
                multiple
              />

              {Object.keys(uploadProgress).length > 0 && (
                <div className="w-full mt-8">
                  <p className="mb-2">Uploading...</p>
                  {Object.entries(uploadProgress).map(([id, progress]) => (
                    <div key={id} className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">File {id}</span>
                        <span className="text-sm">{progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="external" className="h-[400px]">
            <div className="flex flex-col h-full p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="external-url">External URL</Label>
                  <Input
                    id="external-url"
                    placeholder="https://example.com/image.jpg"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                  />
                </div>
                <Button onClick={handleExternalUrlSubmit}>Add Media</Button>
              </div>

              {externalUrl && (
                <div className="mt-8 flex-1 flex items-center justify-center">
                  <div className="border rounded-md p-4 max-w-full max-h-full">
                    {/\.(jpg|jpeg|png|gif|webp)$/i.test(externalUrl) ? (
                      <img
                        src={externalUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="max-w-full max-h-[250px] object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    ) : /\.(mp4|webm|ogg|mov)$/i.test(externalUrl) ? (
                      <video
                        src={externalUrl}
                        controls
                        className="max-w-full max-h-[250px]"
                        onError={(e) => {
                          ;(e.target as HTMLVideoElement).style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Enter a valid image or video URL to see a preview
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

