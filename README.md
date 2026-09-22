# SponZilla MVP — Architecture Scaffold

One-day MVP foundation for a research → evidence → signal → AI analysis → opportunity pipeline.

## Suggested stack
- Backend: TypeScript + Node.js + Fastify
- Validation/schema: Zod
- Frontend: Next.js + TypeScript
- Persistence: PostgreSQL + Prisma (or SQLite for the first local prototype)
- Research: pluggable web-search/source provider
- AI: OpenAI Responses API with structured JSON output
- Tests: Vitest + Playwright
- Deployment: one API + one web app; no microservices

This repository is intentionally a scaffold. It does not implement the application.
