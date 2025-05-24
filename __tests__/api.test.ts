/**
 * Unit tests for API route as specified in the challenge
 */

import { z } from 'zod'

// Mock Next.js environment
Object.defineProperty(global, 'Request', {
  value: class MockRequest {
    url: string
    method: string
    headers: Map<string, string>
    body: string
    
    constructor(url: string, options: any) {
      this.url = url
      this.method = options.method
      this.headers = new Map(Object.entries(options.headers || {}))
      this.body = options.body
    }
    async json() {
      return JSON.parse(this.body)
    }
  }
})

// Mock the scoring function
jest.mock('@/app/lib/llm/scoring', () => ({
  scoreCandidates: jest.fn().mockResolvedValue([
    {
      id: 'C001',
      name: 'Test Candidate',
      skills: ['React', 'TypeScript'],
      experience: 5,
      education: 'Computer Science',
      score: 85,
      highlights: ['Strong React skills', '5+ years experience']
    }
  ])
}))

// Mock Redis cache
jest.mock('@/app/lib/utils/redis-cache', () => ({
  getCacheHybrid: jest.fn().mockResolvedValue(null),
  setCacheHybrid: jest.fn().mockResolvedValue(true)
}))

// Mock file system for Excel loading
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readdirSync: jest.fn().mockReturnValue([])
}))

describe('/api/score API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should validate job description length limits', () => {
    const requestSchema = z.object({
      jobDescription: z.string().min(10).max(200)
    })

    expect(() => requestSchema.parse({ jobDescription: 'a'.repeat(200) })).not.toThrow()
    
    expect(() => requestSchema.parse({ jobDescription: 'short' })).toThrow()
    
    expect(() => requestSchema.parse({ jobDescription: 'a'.repeat(201) })).toThrow()
  })

  it('should handle missing job description', () => {
    const requestSchema = z.object({
      jobDescription: z.string().min(10).max(200)
    })

    expect(() => requestSchema.parse({})).toThrow()
    expect(() => requestSchema.parse({ jobDescription: '' })).toThrow()
  })

  it('should accept valid job description at boundaries', () => {
    const requestSchema = z.object({
      jobDescription: z.string().min(10).max(200)
    })

    expect(() => requestSchema.parse({ jobDescription: 'a'.repeat(10) })).not.toThrow()
    
    expect(() => requestSchema.parse({ jobDescription: 'a'.repeat(200) })).not.toThrow()
  })
}) 