import { useCallback, useRef, useState } from "react"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UploadIcon, FileSpreadsheetIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

interface CSVUploadProps {
  onUploadComplete: () => void
  compact?: boolean
}

export function CSVUpload({ onUploadComplete, compact = false }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        toast.error("Invalid file type", {
          description: "Please upload a CSV file.",
        })
        return
      }

      setIsUploading(true)
      try {
        const result = await api.uploadCSV(file)
        toast.success("Dataset uploaded", {
          description: `Processed ${result.quality_summary.total} records (${result.quality_summary.valid} valid, ${result.quality_summary.issues_found} issues found).`,
        })
        onUploadComplete()
      } catch (err) {
        toast.error("Upload failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [onUploadComplete]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleClearDatabase = async () => {
    const isConfirmed = window.confirm(
      "Are you sure you want to clear the entire database? This will permanently delete all uploaded datasets, records, and quality reports."
    )
    if (!isConfirmed) return

    try {
      await api.clearDatabase()
      toast.success("Database cleared successfully", {
        description: "All operational datasets have been removed.",
      })
      onUploadComplete()
    } catch (err) {
      toast.error("Clear failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  if (compact) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon />
          {isUploading ? "Uploading..." : "Upload CSV"}
        </Button>
      </>
    )
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[75vh] p-6 gap-8">
      <Card className="w-full max-w-lg shadow-md border-border bg-gradient-to-b from-card to-muted/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Upload Shift Data</CardTitle>
          <CardDescription>
            Upload a CSV file with shift records to get started.
            Required columns: DAY_DATE, START, END, HOURS, REASON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleInputChange}
            className="hidden"
          />
          <div
            className={`flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="rounded-full bg-muted p-4">
              <FileSpreadsheetIcon className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">
                {isDragging ? "Drop your file here" : "Drag and drop your CSV file"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or click the button below to browse
              </p>
            </div>
            <Button
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer"
            >
              <UploadIcon />
              {isUploading ? "Processing..." : "Select CSV File"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Database Administration
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearDatabase}
          className="cursor-pointer gap-1.5 shadow-sm"
        >
          <Trash2Icon className="size-3.5" />
          Clear Database
        </Button>
      </div>
    </div>
  )
}
