# MVP Test Plan & 5-Company Evaluation Gate

## 1. Trust & Quality Ship Bar

The Market Intelligence engine and AI-GTM handoff must satisfy the **5-Company Evaluation Gate** prior to production deployment.

### Evaluation Criteria:
1. **Input Validation**: Rejects malformed domains, handles missing protocol (`http`/`https`) gracefully.
2. **Grounded Sources**: Sources must be HTTP 200 reachable. Real URLs and titles retained.
3. **Evidence Extraction**: Facts map strictly to verified source text without hallucinated claims.
4. **No Invented Attributes**: Budgets, sponsorship costs, decision maker names, and contacts are NEVER invented. Missing fields are `null`.
5. **Contract Conformance**: Schema validation strictly enforces `@sponzilla/contracts/v1` `OpportunityV1`.
6. **Automatic Ingestion**: Qualified opportunities (`OPPORTUNITY_DETECTED`) automatically POST to GTM ingest with Bearer authentication.
7. **Production Grounding**: Client-side synthetic research generation is strictly disabled in production.

---

## 2. 5-Company Benchmark Suite

### Company 1: Gymshark
- **Website**: `https://gymshark.com`
- **Signal**: Retail store opening / regional physical expansion.
- **Verification**: Retail expansion news backed by verified HTTP 200 source URLs.
- **Handoff**: Opportunity auto-posted to GTM ingest (`/api/v1/opportunities/ingest`).

### Company 2: Red Bull
- **Website**: `https://redbull.com`
- **Signal**: Event sponsorship / extreme sports activations.
- **Verification**: Public event announcements and verified partnership coverage.
- **Handoff**: Ingested with `stage: NEW`, ready for `RESEARCH_COMPANY` / `SEND_INTRODUCTION`.

### Company 3: Liquid Death
- **Website**: `https://liquiddeath.com`
- **Signal**: Influencer campaigns, festival activations, non-traditional marketing.
- **Verification**: Viral marketing press coverage, zero invented budget figures.
- **Handoff**: Grounded opportunity consumed by GTM decision engine.

### Company 4: Duolingo
- **Website**: `https://duolingo.com`
- **Signal**: Youth/campus activations and social viral campaigns.
- **Verification**: Verified brand campaign coverage, inference explicitly separated from fact.
- **Handoff**: Triggers GTM decision proposing introductory outreach.

### Company 5: Strava
- **Website**: `https://strava.com`
- **Signal**: Brand club challenges, athletic partner sponsorships.
- **Verification**: Official partnerships announcements with live source provenance.
- **Handoff**: GTM pipeline creates opportunity and establishes feedback audit log.

---

## 3. End-to-End Operator Loop Test Protocol

1. Trigger research run via `POST /api/v1/research`.
2. Inspect `ResearchRun` response: verify `status: 'COMPLETED'`, `sources.length > 0`, `evidence.length > 0`.
3. Check `gtmHandoff`: verify `status: 'SUCCESS'` and `gtmOpportunityId` populated when GTM is running.
4. On GTM server, query `/api/v1/opportunities/:id/decision-context` to confirm `intelligenceSnapshot` matches.
5. Generate GTM decision via `/api/v1/opportunities/:id/decisions`.
6. Submit human approval via `POST /api/v1/decisions/:id/approval`.
7. Execute decision via `POST /api/v1/decisions/:id/execution`: verify real executor output (`mode: "REAL_EXECUTION"`).
8. Verify feedback loop: confirm `Opportunity.stage` transitioned and an `Interaction` record exists in database.
