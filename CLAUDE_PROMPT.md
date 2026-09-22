Act like a senior AI GTM systems architect, backend engineer, and pragmatic MVP technical lead.

Your goal is to design a complete, enterprise-quality but one-day-buildable architecture for an MVP called SPONZILLA — MARKET INTELLIGENCE → OPPORTUNITY. The output will be used directly as the implementation blueprint in Antigravity/Claude. Do not implement the application yet.

Task: Produce the architecture and implementation-ready project foundation for a modular-monolith MVP that accepts company name, website URL, optional location, and optional category; researches real sources; extracts evidence; detects recent marketing/business signals; performs AI analysis grounded only in captured evidence; and returns a structured Opportunity for a later GTM decision/action layer.

Requirements:
1. Cover these signals: product launches, store/new-location openings, regional/local expansion, marketing campaigns, youth/campus campaigns, sponsorships, event sponsorships, marketing hiring, influencer campaigns, and college/event activity.
2. Enforce a hard distinction between FACT, EVIDENCE, and AI INFERENCE. Every important factual claim must retain its original source URL and source title. Never invent contacts, budgets, campaigns, sponsorship history, company activity, or opportunities. Missing information must be null/unknown.
3. Keep research/source collection, evidence extraction, signal detection, AI reasoning, and opportunity generation as separate modules with clear interfaces.
4. Preserve these required Opportunity fields: company, signal(s), evidence, audience, marketingNeed, aiInference, confidence, recommendation, status, nextAction, and outcome.
5. Recommend a practical one-day stack and explain why each technology is appropriate. Prefer a modular monolith over microservices, queues, distributed crawlers, autonomous multi-agent systems, complex CRM, or unnecessary authentication.
6. Provide a complete folder tree and explain the responsibility of every important folder/file.
7. Define the backend architecture, frontend architecture, research/source layer, AI analysis layer, data model, validation schemas, API endpoints, environment variables, data flow, error handling, and testing strategy for 5–10 real companies.
8. Design provider interfaces so the web-search/source provider and AI provider can be replaced later without rewriting the domain logic.
9. Include concrete JSON schemas/examples where useful, with required vs optional/null fields made explicit.
10. Include an extension path for future scale, but do not add future features to the MVP itself.

Use this sequence:
Step 1: Restate the architecture objective and non-negotiable constraints briefly.
Step 2: Choose and justify the MVP technology stack.
Step 3: Define the high-level architecture and request/data flow.
Step 4: Define the domain model and strict fact/evidence/inference boundaries.
Step 5: Define the backend modules and folder/file structure.
Step 6: Define the frontend structure and responsibilities.
Step 7: Define the research/source and AI interfaces.
Step 8: Define the Opportunity schema and API contract.
Step 9: Define environment variables, validation, logging, and error handling.
Step 10: Define the 5–10-company test/evaluation plan.
Step 11: Explain how the architecture can evolve without a rewrite.
Step 12: Perform a final scope audit and remove anything that is not necessary for the one-day MVP.

Output constraints:
- Optimize for implementation clarity, reliability, explainability, and speed.
- Do not implement application code.
- Do not propose features outside the stated scope.
- Use Markdown headings, bullets, code blocks, and tables only where they improve clarity.
- Make the folder tree directly usable as a project foundation.
- Treat external research as source-backed data, not model memory.
- Never present an inference as a confirmed fact.
- If a design choice is uncertain, choose the simplest valid option and state the assumption.
- Keep the final architecture detailed enough for an engineer to start building immediately, but avoid unnecessary enterprise ceremony.

Before finalizing, verify that every requested item is covered, that all important claims are traceable to evidence, and that the design remains realistic for a one-day MVP.

Take a deep breath and work on this problem step-by-step.