# LLM-Powered Candidate Screening & Scoring System

A Next.js application that leverages Large Language Models to automatically score and rank candidates based on job descriptions, delivering the top 30 candidates with scores from 0-100.

## Features

- **LLM Integration**: Uses OpenAI GPT-3.5 for intelligent candidate evaluation
- **Batch Processing**: Handles large candidate datasets with efficient batching (10 candidates per request)
- **Retry Logic**: Exponential backoff retry mechanism for API resilience
- **Redis Caching**: Hybrid cache system with 10-minute TTL for performance optimization
- **Excel Support**: Load candidates from Excel files with data validation
- **Modern UI**: Built with Next.js, React, TypeScript, and shadcn/ui

## Installation Steps

1. **Clone the repository**:
```bash
git clone <repository-url>
cd <project-directory>
```

2. **Install dependencies**:
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables** (see Environment Variables section below)

4. **Start Redis** (for caching):
```bash
docker run -d -p 6379:6379 redis:alpine
```

5. **Run the development server**:
```bash
npm run dev
# or
pnpm dev
```

6. **Access the application**:
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Required Variables
```env
# LLM API Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Redis Configuration (optional - falls back to memory cache)
REDIS_URL=redis://localhost:6379

# Cache Configuration
CACHE_TTL=600
```

### Environment Variables Explanation
- **`NEXT_PUBLIC_OPENAI_API_KEY`**: Your OpenAI API key for GPT-3.5 access
- **`REDIS_URL`**: Redis connection string (optional, defaults to memory cache if unavailable)
- **`CACHE_TTL`**: Cache time-to-live in seconds (default: 600 = 10 minutes)

### Production Environment (Docker)
For Docker deployment, create a `.env` file:
```env
NEXT_PUBLIC_OPENAI_API_KEY=your_api_key
REDIS_URL=redis://redis:6379
CACHE_TTL=600
```

## Commands to Run and Test

### Development Commands
```bash
# Start development server with hot reload
npm run dev
# or
pnpm dev

# Build for production
npm run build
# or
pnpm build

# Start production server
npm start
# or
pnpm start

# Lint code
npm run lint
# or
pnpm lint
```

### Testing Commands
```bash
# Run all tests
npm test
# or
pnpm test

# Run tests in watch mode
npm run test:watch
# or
pnpm test:watch
```

### Docker Commands
```bash
# Start with Docker Compose (includes Redis)
docker-compose up -d

# Rebuild and start
docker-compose up --build -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app
```

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── api/
│   │   └── score/         # API endpoint for candidate scoring
│   ├── components/        # UI components
│   ├── data/             # Excel candidate data
│   ├── lib/
│   │   ├── llm/          # LLM integration & scoring logic
│   │   └── utils/        # Utilities (cache, retry logic)
│   └── types/            # TypeScript type definitions
├── __tests__/            # Unit tests (Jest + ts-node)
├── llm/                  # Python scripts (challenge requirement)
├── components/           # shadcn/ui components
├── public/              # Static assets
└── docker-compose.yml   # Docker configuration
```

## API Usage

### POST /api/score
Scores candidates based on job description (≤200 characters).

**Request:**
```json
{
  "jobDescription": "React developer with TypeScript experience"
}
```

**Response:**
```json
[
  {
    "id": "C001",
    "name": "John Doe",
    "skills": ["React", "TypeScript"],
    "experience": 5,
    "education": "Computer Science Degree",
    "score": 85,
    "highlights": ["Strong React skills", "5+ years experience"]
  }
]
```

## Testing Strategy

- **Unit Tests**: API route validation, LLM prompt formatting, error handling
- **Integration Tests**: End-to-end candidate scoring workflow
- **Mock Testing**: LLM API responses and Redis cache operations

Run tests to verify:
- Input validation (job description length limits)
- LLM response parsing and error handling
- Cache functionality
- Batch processing logic

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes, Zod validation
- **LLM**: OpenAI GPT-3.5 Turbo with JSON mode
- **Cache**: Redis with memory fallback
- **Testing**: Jest, ts-node
- **Deployment**: Docker, Docker Compose

## Performance Considerations

- **Batch Processing**: Processes candidates in batches of 5 to avoid context limits
- **Caching**: 10-minute cache TTL reduces redundant LLM calls
- **Retry Logic**: 3-attempt exponential backoff for API resilience
- **Input Validation**: 200-character limit on job descriptions

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## License

[MIT](LICENSE)
