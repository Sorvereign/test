import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { scoreCandidates } from '@/app/lib/llm/scoring'
import { getCacheHybrid, setCacheHybrid } from '@/app/lib/utils/redis-cache'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { list } from '@vercel/blob'
import { Candidate, CandidateResponse } from '@/app/types'
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb'
    },
    responseLimit: false
  },
}

const requestSchema = z.object({
  jobDescription: z.string().min(10).max(200),
})

function generateJobDescriptionHash(jobDescription: string): string {
  return crypto.createHash('md5').update(jobDescription).digest('hex').substring(0, 10);
}

async function loadCandidatesFromBlob(): Promise<Candidate[]> {
  try {
    const { blobs } = await list({
      prefix: 'candidates/',
      limit: 1000,
    })
    
    const excelBlobs = blobs.filter(blob => 
      blob.pathname.endsWith('.xlsx') || blob.pathname.endsWith('.xls')
    )
    
    if (excelBlobs.length === 0) {
      console.log('No Excel files found in blob storage')
      return []
    }

    const latestBlob = excelBlobs[0]
    console.log('Loading candidates from blob:', latestBlob.url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    
    try {
      const response = await fetch(latestBlob.url, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      
      if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
        console.log('File too large, processing first 1000 candidates only')
      }
      
      const workbook = XLSX.read(arrayBuffer)
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as CandidateResponse[]
      
      const candidates = jsonData.map((row, index) => {
        const skills = (row.Habilidades || row.Skills || "")
          .toString()
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
        
        return {
          id: row.ID || row.Id || `C${String(index + 1).padStart(3, '0')}`,
          name: row.Nombre || row.Name || `Candidate ${index + 1}`,
          skills,
          experience: Number(row.Experiencia || row.Experience || 0),
          education: row.Educacion || row.Educación || row.Education || "",
          email: row.Email || row.Correo || ""
        }
      })
      
      console.log(`Successfully loaded ${candidates.length} candidates from blob storage`)
      return candidates.slice(0, 1000)
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.log('Blob fetch timeout, falling back to local files')
      } else {
        console.error('Error fetching from blob:', fetchError)
      }
      return []
    }

  } catch (error) {
    console.error('Error loading candidates from blob storage:', error)
    return []
  }
}

function loadCandidatesFromLocal(): Candidate[] {
  try {
    const possiblePaths = [
      './public/candidates.xlsx',
      './data/candidates.xlsx',
      'public/candidates.xlsx',
      'data/candidates.xlsx',
      path.resolve('./public/candidates.xlsx'),
      path.resolve('./data/candidates.xlsx'),
      path.resolve(process.cwd(), 'public/candidates.xlsx'),
      path.resolve(process.cwd(), 'data/candidates.xlsx')
    ]
    
    console.log('Working directory:', process.cwd())
    
    for (const filePath of possiblePaths) {
      console.log('Trying path:', filePath)
      try {
        if (fs.existsSync(filePath)) {
          console.log('File found at:', filePath)
          
          const workbook = XLSX.readFile(filePath)
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as CandidateResponse[]
          
          const candidates = jsonData.map((row, index) => {
            const skills = (row.Habilidades || row.Skills || "")
              .toString()
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
            
            return {
              id: row.ID || row.Id || `C${String(index + 1).padStart(3, '0')}`,
              name: row.Nombre || row.Name || `Candidate ${index + 1}`,
              skills,
              experience: Number(row.Experiencia || row.Experience || 0),
              education: row.Educacion || row.Educación || row.Education || "",
              email: row.Email || row.Correo || ""
            }
          })
          
          console.log(`Successfully loaded ${candidates.length} candidates from local file`)
          return candidates
        }
      } catch (pathError) {
        console.log(`Error checking path ${filePath}:`, pathError)
        continue
      }
    }
    
    console.error('Excel file not found in any of the attempted local paths')
    return []
    
  } catch (error) {
    console.error('Error loading Excel file from local paths:', error)
    return []
  }
}

async function loadCandidates(): Promise<Candidate[]> {
  let candidates = await loadCandidatesFromBlob()
  
  if (candidates.length === 0) {
    console.log('No candidates found in blob storage, trying local files...')
    candidates = loadCandidatesFromLocal()
  }
  
  return candidates
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const { jobDescription } = requestSchema.parse(body)
    
    const jobHash = generateJobDescriptionHash(jobDescription);
    
    let candidates: Candidate[] = await loadCandidates();
    
    if (candidates.length === 0) {
      candidates = [
        { 
          id: "C001", 
          name: "John Doe", 
          skills: ["React", "TypeScript", "NextJS", "TailwindCSS"],
          experience: 5.2,
          education: "Computer Science Engineer, National University",
          email: "john.doe@example.com"
        },
        { 
          id: "C002", 
          name: "Jane Smith", 
          skills: ["UI/UX", "Figma", "HTML", "CSS", "JavaScript"],
          experience: 3.5,
          education: "UX/UI Designer, Google Certification",
          email: "jane.smith@example.com"
        },
        { 
          id: "C003", 
          name: "Michael Johnson", 
          skills: ["Python", "Django", "SQL", "React", "AWS"],
          experience: 7.8,
          education: "Master in Data Science, Technology University",
          email: "michael.johnson@example.com"
        }
      ]
    }
    
    const candidateHash = crypto.createHash('md5')
      .update(JSON.stringify(candidates.map(c => c.id).sort()))
      .digest('hex')
      .substring(0, 8);
    
    const cacheKey = `job-${jobHash}-${candidateHash}`;
    
    const cached = await getCacheHybrid(cacheKey)
    if (cached) {
      console.log('Cache hit:', cacheKey)
      return NextResponse.json(cached)
    }
    
    const maxCandidates = Math.min(candidates.length, 50)
    const limitedCandidates = candidates.slice(0, maxCandidates)
    
    const batchSize = 3
    const batches = Array.from(
      { length: Math.ceil(limitedCandidates.length / batchSize) },
      (_, i) => limitedCandidates.slice(i * batchSize, (i + 1) * batchSize)
    )
    
    console.log(`Processing ${limitedCandidates.length} candidates in ${batches.length} batches of ${batchSize}`)
    
    const batchPromises = batches.map(batch => 
      scoreCandidates(jobDescription, batch as Candidate[])
    )
    
    const batchResults = await Promise.all(batchPromises)
    const results = batchResults.flat()
    
    const sorted = results.sort((a, b) => b.score - a.score).slice(0, 30)
    
    await setCacheHybrid(cacheKey, sorted, 1800)
    
    return NextResponse.json(sorted)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 