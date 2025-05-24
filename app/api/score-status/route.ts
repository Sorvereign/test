import { NextRequest, NextResponse } from 'next/server'

const processingJobs = new Map<string, {
  status: 'processing' | 'completed' | 'error',
  results?: any,
  error?: string,
  progress?: number
}>()

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

export async function POST(req: NextRequest) {
  const jobId = crypto.randomUUID()
  
  processingJobs.set(jobId, {
    status: 'processing',
    progress: 0
  })
  
  return NextResponse.json({ jobId, status: 'started' })
} 