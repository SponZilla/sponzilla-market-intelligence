# SponZilla MVP Architecture

## Pipeline
Company input
→ research/source collection
→ evidence extraction
→ signal detection
→ AI analysis
→ commercial relevance
→ opportunity generation
→ structured JSON
→ PostgreSQL persistence

## Grounding rule
A FACT must be supported by captured evidence and its original source URL.
An AI INFERENCE is derived from facts/evidence and must never be represented as a fact.
Unknown or unsupported values are null/unknown rather than invented.

Evidence is selected from verified page content rather than search snippets. Each
source records bounded content, a content hash, retrieval timestamp, and provider
priority. Each evidence item records its content hash and exact excerpt offsets.
Confidence is a deterministic heuristic based on verification, content quality,
source type, recency, and corroboration; it is not presented as a calibrated
probability.

## Scope
Designed for roughly 5–10 real-company evaluations and a one-day MVP build.
Use a modular monolith. Research runs and opportunities are stored as validated
JSONB payloads in PostgreSQL so API reads survive process restarts while the
provider interfaces remain replaceable. Distributed systems, queues, agents,
and scraping infrastructure are outside the MVP scope. Official API providers
are the production path; the explicitly named Bing compatibility provider is
not selected by default.
