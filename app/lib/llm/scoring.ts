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
  
  const userPrompt = `Job: ${jobDescription.substring(0, 200)}

Candidates:
${candidates.map(c => 
  `${c.id}: ${c.skills?.slice(0, 5).join(', ')} | ${c.experience}y | ${c.education?.substring(0, 50)}`
).join('\n')}`

  const createChatCompletion = () => openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    temperature: 0.1,
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })

  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('LLM timeout')), 15000) // 15 second timeout
    )
    
    const response = await Promise.race([
      retryWithBackoff(createChatCompletion, 2), // Reduce retries
      timeoutPromise
    ]) as Awaited<ReturnType<typeof createChatCompletion>>
    
    const content = response.choices[0]?.message.content || '{}'
    const parsed = JSON.parse(content)
    const validated = llmResponseSchema.parse(parsed)
    
    return validateAndMapResults(validated.candidates, candidates)
  } catch (error) {
    console.error('LLM Error:', error)
    
    return candidates.map(candidate => ({
      ...candidate,
      score: calculateFallbackScore(jobDescription, candidate),
      highlights: [`${candidate.experience} years experience`, `Skills: ${candidate.skills?.slice(0, 2).join(', ')}`]
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

function calculateFallbackScore(jobDescription: string, candidate: Candidate): number {
  const jobKeywords = jobDescription.toLowerCase().split(/\s+/)
  const candidateSkills = candidate.skills?.map(s => s.toLowerCase()) || []
  
  const matchingSkills = candidateSkills.filter(skill => 
    jobKeywords.some(keyword => keyword.includes(skill) || skill.includes(keyword))
  )
  
  const skillScore = (matchingSkills.length / Math.max(candidateSkills.length, 1)) * 60
  const experienceScore = Math.min(candidate.experience * 3, 30)
  const educationScore = candidate.education ? 10 : 0
  
  return Math.round(skillScore + experienceScore + educationScore)
} 