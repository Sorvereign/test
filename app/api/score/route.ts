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

export const maxDuration = 60; // 60 seconds timeout

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

    const response = await fetch(latestBlob.url)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
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
    return candidates

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
  const candidatesCacheKey = 'candidates-data'
  const cached = await getCacheHybrid(candidatesCacheKey)
  if (cached && Array.isArray(cached)) {
    console.log('Using cached candidates data')
    return cached as Candidate[]
  }

  let candidates = await loadCandidatesFromBlob()
  
  if (candidates.length === 0) {
    console.log('No candidates found in blob storage, trying local files...')
    candidates = loadCandidatesFromLocal()
  }
  
  if (candidates.length > 0) {
    await setCacheHybrid(candidatesCacheKey, candidates, 1800)
  }
  
  return candidates
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const { jobDescription } = requestSchema.parse(body)
    
    const jobHash = generateJobDescriptionHash(jobDescription);
    const candidateHash = 'default'; 
    const cacheKey = `job-${jobHash}-${candidateHash}`;
    
    const cached = await getCacheHybrid(cacheKey)
    if (cached) {
      console.log('Cache hit:', cacheKey)
      return NextResponse.json(cached)
    }
    
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

    const limitedCandidates = candidates.slice(0, 50)
    console.log(`Processing ${limitedCandidates.length} candidates (limited from ${candidates.length})`)
    
    const batchSize = 3
    const batches = Array.from(
      { length: Math.ceil(limitedCandidates.length / batchSize) },
      (_, i) => limitedCandidates.slice(i * batchSize, (i + 1) * batchSize)
    )
    
    const results = []
    for (const batch of batches) {
      try {
        const scored = await scoreCandidates(jobDescription, batch as Candidate[])
        results.push(...scored)
        
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error('Error scoring batch:', error)
        continue
      }
    }
    
    const sorted = results.sort((a, b) => b.score - a.score).slice(0, 30)
    
    await setCacheHybrid(cacheKey, sorted, 600)
    
    return NextResponse.json(sorted)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 