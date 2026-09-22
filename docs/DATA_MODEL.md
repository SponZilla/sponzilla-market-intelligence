# Core Data Model

Recommended entities:
- Company
- ResearchRun
- Source
- Evidence
- Signal
- Opportunity

Keep source URLs immutable once captured. Evidence should reference the source.
Signals should reference one or more evidence records. Opportunity fields should
retain links back to the supporting signal/evidence records.
