import { Candidate } from '@/app/types'


export function preprocessCandidates(candidates: Candidate[]): Candidate[] {
  return candidates
    .filter((c, index, self) =>
      self.findIndex(t => 
        t.email === c.email || 
        (t.name === c.name && t.experience === c.experience)
      ) === index
    )
    .map(c => ({
      ...c,
      skills: Array.from(new Set(c.skills?.map(normalizeSkill) || [])),
      experience: Math.round(c?.experience * 10) / 10
    }))
}

const normalizeSkill = (skill: string) => 
  skill.trim().toLowerCase().replace(/[^\w\s]/gi, '') 