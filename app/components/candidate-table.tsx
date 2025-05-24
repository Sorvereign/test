import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ScoredCandidate } from "../types"

export const CandidateTable = ({ data }: { data: ScoredCandidate[] }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[200px]">Name</TableHead>
        <TableHead>Score</TableHead>
        <TableHead>Highlights</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((candidate) => (
        <TableRow key={candidate.id}>
          <TableCell className="font-medium">{candidate.name}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Progress value={candidate.score} className="h-2 w-[100px]" />
              <span>{Math.round(candidate.score)}</span>
            </div>
          </TableCell>
          <TableCell>
            <ul className="list-disc pl-4">
              {candidate.highlights.map((h, i) => (
                <li key={i} className="text-sm text-muted-foreground">{h}</li>
              ))}
            </ul>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
) 