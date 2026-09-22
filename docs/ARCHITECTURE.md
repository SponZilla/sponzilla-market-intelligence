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

## Grounding rule
A FACT must be supported by captured evidence and its original source URL.
An AI INFERENCE is derived from facts/evidence and must never be represented as a fact.
Unknown or unsupported values are null/unknown rather than invented.

## Scope
Designed for roughly 5–10 real-company evaluations and a one-day MVP build.
Use a modular monolith. Keep provider interfaces replaceable without introducing
distributed systems, queues, agents, or scraping infrastructure.
