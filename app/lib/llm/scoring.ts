import OpenAI from 'openai'
import { z } from 'zod'
import { retryWithBackoff } from '@/app/lib/utils/retry'
import { Candidate, ScoredCandidate } from '@/app/types'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  maxRetries: 0
})

const systemPrompt = `You are an expert HR professional with 15 years of experience in technical matching. 
Analyze the following candidates and assign a score from 0-100 considering:
1. Exact match of technical skills (50% weight)
2. Relevant experience measured in years (30% weight)
3. Education and certifications (20% weight)

Respond EXCLUSIVELY with valid JSON using this format:
{
  "candidates": [
    {
      "id": "string",
      "score": number,
      "highlights": string[]
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
  
  const userPrompt = `**Position to fill:**\n${jobDescription}\n\n**Candidates to evaluate:**\n${
    candidates.map(c => 
      `ID: ${c.id}\nSkills: ${c.skills?.join(', ')}\nExperience: ${c.experience} years\nEducation: ${c.education}`
    ).join('\n\n')
  }`

  const createChatCompletion = () => openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })

  try {
    const response = await retryWithBackoff(createChatCompletion, 3)
    
    const content = response.choices[0]?.message.content || '{}'
    const parsed = JSON.parse(content)
    const validated = llmResponseSchema.parse(parsed)
    
    return validateAndMapResults(validated.candidates, candidates)
  } catch (error) {
    console.error('LLM Error:', error)
    throw new Error('Error processing candidates')
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