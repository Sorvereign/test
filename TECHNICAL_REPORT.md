# Technical Report: LLM-Powered Candidate Screening System

## Architecture Overview

The system follows a modern full-stack architecture with clear separation between frontend, API layer, LLM integration, and caching mechanisms.

[![](https://mermaid.ink/img/pako:eNqNlN9v2jAQx_8Vy0-dxI-UhAB5mFRKmahoi1jZQ5M9mOQAj8SOHKPBEP_7bIeEBLGpebHvc1-fz3enHHHII8AeXguSbtD7MBABQ-rLdsscBXgsOJPAIjQlBxABLiT6W0z8OZBQtl9hL1u_MgV-Vv1jGsMijTmJ_Kd9CLEBKCc14TNfjrlIfLWiEWShoKmknCENS6FKotjeyPNhNrmVosJ-gNskpe0s5AJ0lJRTJgNcy-AHiWlE9KX-B4_QhKU7WYE17ZDIcDMTPIQs48I3JirtT-Y7IpLcStgUaqoKBKJatJzU0ngkLNLpwWjo35UG0oG_XAnDDfh3c4holht1_wskuURtuDigMYnjJQm3n3zJdPqi6iVB2bpU9ee8pcAeJn6-oG-z96bd6tZuV4VLUvnE1pSBnxsot0BQtq5p5yDFYcrXNPTNFv2mcqP6EW75anWlzFLOMpgRkalKPn9_ey0ZyuH_nreYoGbzq56eglxm2XgqbSoU5yG-PqgHU6PLMBWeCzEC04PCZwzUbCletOc64I0UKugcshyR69P1IS68dWqE1f4Usiozory_hfvcbe24dKxwXshZUG3URVSl_yqpKQtuqN8XjbAnxQ4aOAGREG3ioxYHWG4ggQB7ahsRsVXjyU7qTErYB-dJcUzw3XqDvRWJM2XtUlM0StRMJyUValBAPPIdk9jrdEwM7B3xHnu2bbWcXsd17x3btt3evdPAB4UHLWvQc92-3e84VqfruKcG_mOutVoDx-lbjm25_fuu5TqD01_Fxr5P?type=png)](https://mermaid.live/edit#pako:eNqNlN9v2jAQx_8Vy0-dxI-UhAB5mFRKmahoi1jZQ5M9mOQAj8SOHKPBEP_7bIeEBLGpebHvc1-fz3enHHHII8AeXguSbtD7MBABQ-rLdsscBXgsOJPAIjQlBxABLiT6W0z8OZBQtl9hL1u_MgV-Vv1jGsMijTmJ_Kd9CLEBKCc14TNfjrlIfLWiEWShoKmknCENS6FKotjeyPNhNrmVosJ-gNskpe0s5AJ0lJRTJgNcy-AHiWlE9KX-B4_QhKU7WYE17ZDIcDMTPIQs48I3JirtT-Y7IpLcStgUaqoKBKJatJzU0ngkLNLpwWjo35UG0oG_XAnDDfh3c4holht1_wskuURtuDigMYnjJQm3n3zJdPqi6iVB2bpU9ee8pcAeJn6-oG-z96bd6tZuV4VLUvnE1pSBnxsot0BQtq5p5yDFYcrXNPTNFv2mcqP6EW75anWlzFLOMpgRkalKPn9_ey0ZyuH_nreYoGbzq56eglxm2XgqbSoU5yG-PqgHU6PLMBWeCzEC04PCZwzUbCletOc64I0UKugcshyR69P1IS68dWqE1f4Usiozory_hfvcbe24dKxwXshZUG3URVSl_yqpKQtuqN8XjbAnxQ4aOAGREG3ioxYHWG4ggQB7ahsRsVXjyU7qTErYB-dJcUzw3XqDvRWJM2XtUlM0StRMJyUValBAPPIdk9jrdEwM7B3xHnu2bbWcXsd17x3btt3evdPAB4UHLWvQc92-3e84VqfruKcG_mOutVoDx-lbjm25_fuu5TqD01_Fxr5P)

## Component Overview

**Frontend Components:**
- **FileUpload**: Handles Excel file processing and candidate data extraction
- **JobForm**: Collects job description input with 200-character validation
- **CandidateTable**: Displays ranked candidates with scores and highlights

**Backend Components:**
- **API Route** (`/api/score`): Main endpoint for candidate scoring with input validation
- **LLM Scorer**: Manages OpenAI integration with structured prompts and retry logic
- **Cache Manager**: Hybrid Redis/memory caching with 10-minute TTL
- **Batch Processor**: Handles large candidate datasets in chunks of 5

## Example Prompts & Design Rationale

**System Prompt:**
```
You are an expert HR professional with 15 years of experience in technical matching. 
Analyze the following candidates and assign a score from 0-100 considering:
1. Exact match of technical skills (50% weight)
2. Relevant experience measured in years (30% weight) 
3. Education and certifications (20% weight)

Respond EXCLUSIVELY with valid JSON using this format:
{"candidates": [{"id": "string", "score": number, "highlights": ["string"]}]}
```

**User Prompt Example:**
```
**Position to fill:**
React developer with TypeScript experience

**Candidates to evaluate:**
ID: C001
Skills: React, TypeScript, Node.js
Experience: 5 years
Education: Computer Science Degree
```

**Design Rationale:**
- **Structured weighting** ensures consistent evaluation criteria across all requests
- **JSON-only response** eliminates parsing ambiguity and improves reliability
- **Clear role definition** leverages LLM's capability for professional judgment
- **Batch processing** optimizes API costs while maintaining context coherence

## Challenges Encountered & Solutions

**Challenge 1: Context Length Limits**
- *Problem*: Large candidate datasets exceeded GPT-3.5 context window
- *Solution*: Implemented batch processing (5 candidates per request) with controlled parallelism

**Challenge 2: API Rate Limiting & Reliability**
- *Problem*: OpenAI API 429 errors and intermittent failures
- *Solution*: Exponential backoff retry logic (3 attempts) with progressive delays

**Challenge 3: Inconsistent LLM Responses**
- *Problem*: Varied response formats causing parsing failures
- *Solution*: Strict JSON mode enforcement + Zod schema validation for response structure

**Challenge 4: Performance Optimization**
- *Problem*: Repeated identical requests causing unnecessary API calls
- *Solution*: Redis caching with MD5-hashed keys (job description + candidate set) and 10-minute TTL

**Challenge 5: Environment Portability**
- *Problem*: Different deployment environments (local, Docker, production)
- *Solution*: Hybrid cache system (Redis primary, memory fallback) + comprehensive environment variable configuration

## Key Technical Decisions

1. **Next.js App Router**: Chosen for modern React patterns and built-in API routes
2. **GPT-3.5 Turbo**: Optimal balance of cost, speed, and capability for scoring tasks
3. **Zod Validation**: Ensures type safety across frontend/backend boundaries
4. **Jest + ts-node**: Comprehensive testing strategy with mock LLM responses
5. **Docker Compose**: Simplified local development with Redis integration 