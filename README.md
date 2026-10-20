# SponZilla — Market Intelligence Engine

Grounded research pipeline transforming raw company input and live web sources into verified marketing signals, evidence facts, and canonical `OpportunityV1` contracts for GTM execution.

## Features
- **Live Search & Source Verification**: Pluggable providers (Tavily, Brave, DuckDuckGo) verifying live HTTP 200 URLs.
- **Evidence Extraction**: Facts strictly tied to source URLs and titles; zero fabricated facts.
- **Signal Detection**: Detects product launches, store openings, marketing campaigns, sponsorships, and campus activity.
- **Strict Grounding Rule**: Missing information remains `null`. Contacts, budgets, and sponsorship history are never invented. Client-side synthetic research is disabled in production.
- **Automated GTM Handoff**: Qualified opportunities automatically POST to GTM ingest with Bearer authentication.
- **Operator Loop & 5-Company Eval Gate**: Documented in [docs/OPERATOR_LOOP_AND_EVAL_GATE.md](./docs/OPERATOR_LOOP_AND_EVAL_GATE.md) and [docs/TEST_PLAN.md](./docs/TEST_PLAN.md).

## Getting Started

```bash
npm install
npm run build
npm test
```
