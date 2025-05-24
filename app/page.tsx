"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { CandidateTable } from "./components/candidate-table"
import { FileUpload } from "./components/file-upload"
import { Loader2 } from "lucide-react"
import { Candidate, ScoredCandidate } from "./types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const FormSchema = z.object({
  jobDescription: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }).max(200, {
    message: "Description cannot exceed 200 characters",
  })
})

export default function Home() {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })
  
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [results, setResults] = useState<ScoredCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [activeTab, setActiveTab] = useState<string>("description")

  const handleCandidatesProcessed = (loadedCandidates: Candidate[]) => {
    setCandidates(loadedCandidates)
    setActiveTab("description")
  }

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          jobDescription: data.jobDescription
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Error: ${response.status}`)
      }
      
      const scoredCandidates = await response.json()
      setResults(scoredCandidates)
    } catch (err) {
      console.error("Error fetching data, using mock data instead:", err)
      setError("Error connecting to API, using demo data")
      
      const mockCandidates: ScoredCandidate[] = [
        { 
          id: "C001", 
          name: "John Doe", 
          skills: ["React", "TypeScript", "NextJS", "TailwindCSS"],
          experience: 5.2,
          education: "Computer Science Engineer, National University",
          score: 85, 
          highlights: ["5 years React experience", "Next.js knowledge", "Fluent English"] 
        },
        { 
          id: "C002", 
          name: "Jane Smith", 
          skills: ["UI/UX", "Figma", "HTML", "CSS", "JavaScript"],
          experience: 3.5,
          education: "UX/UI Designer, Google Certification",
          score: 78, 
          highlights: ["UI/UX specialist", "3 years frontend development", "Outstanding portfolio"] 
        },
        { 
          id: "C003", 
          name: "Michael Johnson", 
          skills: ["Python", "Django", "SQL", "React", "AWS"],
          experience: 7.8,
          education: "Master in Data Science, Technology University",
          score: 92, 
          highlights: ["Fullstack developer", "Large project experience", "Relevant certifications"] 
        },
      ]
      
      setResults(mockCandidates)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Candidate Evaluation System</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upload">Upload Candidates</TabsTrigger>
              <TabsTrigger value="description">Job Description</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <div className="space-y-6">
                <FileUpload onFileProcessed={handleCandidatesProcessed} isLoading={loading} />
                
                {candidates.length > 0 && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 text-green-400">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          {candidates.length} candidates loaded successfully
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab("description")} disabled={candidates.length === 0}>
                    Continue
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="description">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {candidates.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{candidates.length} candidates ready for evaluation</span>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="h-auto p-0" 
                      onClick={() => setActiveTab("upload")}
                    >
                      Change
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Textarea
                    {...register('jobDescription')}
                    placeholder="Enter job description (requirements, responsibilities, etc.)"
                    className="h-32"
                    maxLength={200}
                  />
                  {errors.jobDescription && (
                    <p className="text-sm text-red-500">{errors.jobDescription.message}</p>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Processing...' : 'Generate Ranking'}
                  </Button>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                  {error}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        {results.length > 0 && (
          <CardFooter>
            <div className="w-full">
              <h3 className="text-xl font-semibold mb-4">Top Candidates</h3>
              <CandidateTable data={results} />
            </div>
          </CardFooter>
        )}
      </Card>
    </main>
  )
}
