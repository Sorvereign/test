/**
 * Unit tests for LLM scoring logic as specified in the challenge
 */

import { scoreCandidates } from '@/app/lib/llm/scoring'
import { Candidate } from '@/app/types'

// Mock OpenAI
jest.mock('openai', () => {
  const mockCreate = jest.fn()
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  }
})

describe('LLM Scoring Logic', () => {
  const sampleCandidates: Candidate[] = [
    {
      id: 'C001',
      name: 'John Doe',
      skills: ['React', 'TypeScript', 'Node.js'],
      experience: 5,
      education: 'Computer Science Degree',
      email: 'john@example.com'
    },
    {
      id: 'C002', 
      name: 'Jane Smith',
      skills: ['Python', 'Django', 'PostgreSQL'],
      experience: 3,
      education: 'Software Engineering Degree',
      email: 'jane@example.com'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should properly format candidates for LLM prompt', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            candidates: [
              { id: 'C001', score: 85, highlights: ['Strong React skills'] },
              { id: 'C002', score: 70, highlights: ['Python experience'] }
            ]
          })
        }
      }]
    }

    const OpenAI = require('openai').default
    const mockInstance = new OpenAI()
    mockInstance.chat.completions.create.mockResolvedValue(mockResponse)

    await scoreCandidates('React developer needed', sampleCandidates)

    const calls = mockInstance.chat.completions.create.mock.calls
    expect(calls).toHaveLength(1)
    
    const userPrompt = calls[0][0].messages[1].content
    expect(userPrompt).toContain('React developer needed')
    expect(userPrompt).toContain('C001')
    expect(userPrompt).toContain('React, TypeScript, Node.js')
    expect(userPrompt).toContain('5 years')
  })

  it('should handle valid LLM response and parse correctly', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            candidates: [
              { id: 'C001', score: 85, highlights: ['Strong React skills', 'Good experience'] },
              { id: 'C002', score: 60, highlights: ['Different tech stack'] }
            ]
          })
        }
      }]
    }

    const OpenAI = require('openai').default
    const mockInstance = new OpenAI()
    mockInstance.chat.completions.create.mockResolvedValue(mockResponse)

    const results = await scoreCandidates('React developer', sampleCandidates)

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({
      ...sampleCandidates[0],
      score: 85,
      highlights: ['Strong React skills', 'Good experience']
    })
    expect(results[1]).toEqual({
      ...sampleCandidates[1], 
      score: 60,
      highlights: ['Different tech stack']
    })
  })

  it('should handle LLM errors and throw appropriate error', async () => {
    const OpenAI = require('openai').default
    const mockInstance = new OpenAI()
    mockInstance.chat.completions.create.mockRejectedValue(new Error('API Error'))

    await expect(scoreCandidates('React developer', sampleCandidates))
      .rejects.toThrow('Error processing candidates')
  })

  it('should handle invalid JSON response from LLM', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'Invalid JSON response'
        }
      }]
    }

    const OpenAI = require('openai').default
    const mockInstance = new OpenAI()
    mockInstance.chat.completions.create.mockResolvedValue(mockResponse)

    await expect(scoreCandidates('React developer', sampleCandidates))
      .rejects.toThrow('Error processing candidates')
  })

  it('should filter out candidates with missing IDs', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            candidates: [
              { id: 'C001', score: 85, highlights: ['Good fit'] },
              { id: 'C999', score: 90, highlights: ['Nonexistent candidate'] }
            ]
          })
        }
      }]
    }

    const OpenAI = require('openai').default
    const mockInstance = new OpenAI()
    mockInstance.chat.completions.create.mockResolvedValue(mockResponse)

    const results = await scoreCandidates('React developer', sampleCandidates)

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('C001')
  })
}) 