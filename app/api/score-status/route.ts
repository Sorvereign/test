import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface JobStatus {
  status: 'processing' | 'completed' | 'error'
  results?: unknown
  error?: string
  progress?: number
}

const processingJobs = new Map<string, JobStatus>()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
  }
  
  const job = processingJobs.get(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  
  return NextResponse.json(job)
}

export async function POST() {
  const jobId = crypto.randomUUID()
  
  processingJobs.set(jobId, {
    status: 'processing',
    progress: 0
  })
  
  return NextResponse.json({ jobId, status: 'started' })
} 