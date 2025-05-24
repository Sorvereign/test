import OpenAI from 'openai'
import { z } from 'zod'
import { retryWithBackoff } from '@/app/lib/utils/retry'
import { Candidate, ScoredCandidate } from '@/app/types'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  maxRetries: 1,
  timeout: 15000
})

const systemPrompt = `Score candidates 0-100 based on job match. Respond only with JSON:
{
  "candidates": [
    {
      "id": "string",
      "score": number,
      "highlights": ["reason1", "reason2"]
    }
  ]
}`

const llmResponseSchema = z.object({
  candidates: z.array(
    z.object({
      id: z.string(),
      score: z.number().min(0).max(100),
      highlights: z.array(z.string())
    })
  )
})

export async function scoreCandidates(
  jobDescription: string,
  candidates: Candidate[]
): Promise<ScoredCandidate[]> {
  
  const userPrompt = `Job: ${jobDescription.slice(0, 200)}\n\nCandidates:\n${
    candidates.map(c => 
      `${c.id}: ${c.skills?.slice(0, 5).join(', ')} (${c.experience}y)`
    ).join('\n')
  }`

  const createChatCompletion = () => openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })

  try {
    const response = await retryWithBackoff(createChatCompletion, 2)
    
    const content = response.choices[0]?.message.content || '{}'
    const parsed = JSON.parse(content)
    const validated = llmResponseSchema.parse(parsed)
    
    return validateAndMapResults(validated.candidates, candidates)
  } catch (error) {
    console.error('LLM Error:', error)
    return candidates.map(c => ({
      ...c,
      score: Math.random() * 40 + 30,
      highlights: ['Processing timeout - showing random score']
    }))
  }
}

function validateAndMapResults(
  llmResults: z.infer<typeof llmResponseSchema>['candidates'],
  originalCandidates: Candidate[]
): ScoredCandidate[] {
  return llmResults
    .map(result => {
      const original = originalCandidates.find(c => c.id === result.id)
      if (!original) return null
      
      return {
        ...original,
        score: result.score,
        highlights: result.highlights
      }
    })
    .filter(Boolean) as ScoredCandidate[]
} 