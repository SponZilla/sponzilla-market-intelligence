# Error Handling

Normalize errors into:
- VALIDATION_ERROR
- RESEARCH_PROVIDER_ERROR
- SOURCE_FETCH_ERROR
- AI_ANALYSIS_ERROR
- PERSISTENCE_ERROR
- INTERNAL_ERROR

Never silently turn provider failures into invented evidence. Preserve partial
research when safe and mark the affected stage as failed/incomplete.
