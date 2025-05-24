"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadCloud, Download } from "lucide-react"
import * as XLSX from "xlsx"
import { Candidate, CandidateResponse } from "../types"

interface FileUploadProps {
  onFileProcessed: (candidates: Candidate[]) => void
  isLoading?: boolean
}

export function FileUpload({ onFileProcessed, isLoading = false }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const processExcel = async (file: File) => {
    try {
      setError(null)
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(sheet) as CandidateResponse[]
      
      const candidates = jsonData.map((row, index) => {
        const skills = (row.Skills || row.Habilidades || "")
          .toString()
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
        
        return {
          id: row.ID || `C${String(index + 1).padStart(3, '0')}`,
          name: row.Nombre || row.Name || `Candidate ${index + 1}`,
          skills,
          experience: Number(row.Experiencia || row.Experience || 0),
          education: row.Educacion || row.Educación || row.Education || "",
          email: row.Email || row.Correo || ""
        }
      })

      if (candidates.length === 0) {
        setError("No valid data found in Excel file")
        return
      }

      onFileProcessed(candidates as Candidate[])
      
    } catch (err) {
      console.error("Error processing Excel file:", err)
      setError("Error processing file. Make sure it's a valid Excel file.")
    }
  }

  const uploadToBlob = async (file: File) => {
    try {
      setIsUploading(true)
      
      // Check file size before upload (10MB limit)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        setError(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: 10MB.`)
        return
      }
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload-candidates', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 413) {
          setError('File too large. Please use a file smaller than 10MB.')
        } else {
          throw new Error(errorData.error || 'Upload failed')
        }
        return
      }
      
      const result = await response.json()
      console.log('File uploaded to blob storage:', result.url)
      
    } catch (err) {
      console.error("Error uploading to blob storage:", err)
      setError("Error uploading to cloud storage. File was processed locally.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
                    file.type === "application/vnd.ms-excel" ||
                    file.name.endsWith('.xlsx') ||
                    file.name.endsWith('.xls')
    
    if (!isExcel) {
      setError("Please select a valid Excel file (.xlsx or .xls)")
      setFileName(null)
      return
    }

    setFileName(file.name)
    
    await processExcel(file)
    
    uploadToBlob(file)
  }

  const downloadTemplate = async () => {
    try {
      setIsDownloading(true)
      const response = await fetch('/api/download-template')
      
      if (!response.ok) {
        throw new Error(`Error downloading template: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = 'candidates_template.xlsx'
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Error downloading template:", err)
      setError("Error downloading candidate template")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="candidates-file">Candidates File</Label>
          <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0 flex items-center gap-1 text-primary" 
            onClick={downloadTemplate}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
            <span>{isDownloading ? 'Downloading...' : 'Download Template'}</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            id="candidates-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isLoading || isUploading}
            className="flex-1"
          />
          <Button variant="outline" disabled={isLoading || isUploading} asChild>
            <label htmlFor="candidates-file" className="cursor-pointer flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Select'}
            </label>
          </Button>
        </div>
        
        {fileName && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              File loaded: {fileName}
            </p>
            {isUploading && (
              <p className="text-sm text-blue-600">
                📤 Uploading to cloud storage...
              </p>
            )}
          </div>
        )}
        {error && (
          <p className="text-sm text-red-500 mt-1">
            {error}
          </p>
        )}
        
        <div className="text-sm text-muted-foreground mt-2">
          <p>The file must be an Excel (.xlsx or .xls) with the following columns:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>ID - Unique candidate identifier</li>
            <li>Name - Full name of the candidate</li>
            <li>Skills - List of skills separated by commas</li>
            <li>Experience - Years of experience (number)</li>
            <li>Education - Academic background</li>
            <li>Email - Email address (optional)</li>
          </ul>
          <p className="mt-2 text-xs text-blue-600">
            💡 Files are automatically saved to cloud storage for future use
          </p>
        </div>
      </div>
    </div>
  )
} 