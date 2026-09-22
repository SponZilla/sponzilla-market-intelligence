# API Surface

POST /api/v1/research
GET  /api/v1/research/:runId
GET  /api/v1/opportunities/:id
GET  /api/v1/health

The research endpoint accepts companyName, websiteUrl, and optional location/category.
Return machine-readable JSON with explicit facts/evidence and AI inference fields.
