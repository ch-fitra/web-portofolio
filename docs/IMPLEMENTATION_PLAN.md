# Implementation plan

Source: complete PRD v1. User overrides: native local PostgreSQL, DBeaver administration, self-hosted server; no hosted database/auth/storage or hosting vendor required.

- [x] Phase 0: Next.js/TypeScript, tokens, versioned SQL migrations, least-privilege database roles, owner sessions, setup tooling.
- [x] Phase 1 public: all routes, CMS content, independent portraits, project filters/chapters, contact persistence, themes/motion.
- [x] Phase 1 studio: profile/settings, project and block CRUD, authenticated preview, publication, skills/certificates, media/inbox.
- [x] Verification: validation/auth/media tests, live PostgreSQL RLS/integration, browser desktop/mobile core workflow checks, lint/typecheck/build. Full release audits remain below.
- [x] Delivery: DBeaver instructions, standalone/Docker deployment examples, backups, CMS guide and actual test report.
- [ ] Release content gate: owner supplies two portraits and reviews at least three real case studies. Draft seeds never publish automatically.
- [ ] Phase 1.5 follow-up: field performance/assistive technology audits and editorial content review.
- [ ] Phase 2: grounded AI assistant/recommender; intentionally disabled until separately implemented and verified.

Implementation uses JSONB for validated, ordered project chapters and localized profile/settings documents; version snapshots preserve case-study edits. PostgreSQL roles enforce public/owner/auth boundaries independently of the application.
