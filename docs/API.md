# API Surface

POST /api/v1/research
GET  /api/v1/research/:runId
GET  /api/v1/opportunities/:id
GET  /api/v1/health

All research and opportunity endpoints except health require a Bearer token
matching `RESEARCH_API_KEY` (or the equivalent `x-api-key` header). Configure
`SEARCH_PROVIDER` explicitly in production and provide its matching credential:
`TAVILY_API_KEY` for `tavily`, or `BRAVE_API_KEY` for `brave`. `duckduckgo` uses
only the documented Instant Answer API and is not a general web-search fallback.

The research endpoint accepts companyName, websiteUrl, and optional location/category.
Return machine-readable JSON with explicit facts/evidence and AI inference fields.

Verified sources retain extracted page text, a SHA-256 content hash, retrieval
timestamp, and evidence excerpt offsets. Search snippets are discovery metadata
and are not used as authoritative evidence when page content is available.

Research runs and opportunities require `DATABASE_URL` and are persisted in
PostgreSQL. The API initializes its two JSONB-backed tables on first persistence
access; production deployments should run with a dedicated database role that
can create or migrate these tables during deployment.
