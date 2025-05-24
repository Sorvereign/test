export interface Candidate {
  id?: string
  name?: string
  skills?: string[]
  experience: number
  education?: string
  email?: string
}

export type CandidateResponse = {
  ID?: string
  Nombre?: string
  Habilidades?: string
  Experiencia?: number
  Educacion?: string
  Educación?: string
  Email?: string
  Correo?: string
  Skills?: string
  Experience?: number
  Education?: string
  Id?: string
  Name?: string
}

export type ScoredCandidate = Candidate & {
  score: number;
  highlights: string[];
} 