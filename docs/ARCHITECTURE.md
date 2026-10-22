# Architecture

Next.js App Router 16 + React 19 + TypeScript; server components render SEO content, client components handle chapter editing, filters, theme/motion, form status and Motion reveals. Tailwind 4 with CSS tokens implements Graphite Intelligence. No microservices or platform hosting/auth/storage dependencies.

## Data and trust boundaries

`pg` pools use three distinct logins. `portfolio_public` only SELECTs public documents, published projects, visible skill/certification records and media referenced by public content. `portfolio_owner` edits content/inbox/media/revisions but cannot read passwords/sessions. `portfolio_auth` only manages the single owner credential, hashed sessions and rate-limit counters. Migration credentials create roles/tables and never belong in production runtime. Every table has ENABLE + FORCE ROW LEVEL SECURITY; runtime roles are non-superuser/non-BYPASSRLS and do not own tables. No SET ROLE membership is granted. Policies use actual PostgreSQL roles rather than forgeable application flags. Direct clients with the public connection cannot insert contacts; the validated server action uses the private owner connection.

`documents` stores schema-validated profile/settings JSONB; `projects` has indexed slug/status and typed chapter/block JSONB. Chapters and blocks are ordered arrays with stable UUID anchors. `records` stores validated skills/certifications. This intentionally consolidates the PRD’s normalized chapter/block tables for a single-owner CMS; all business copy remains in data. Revisions save previous project documents before edits; restoration always creates a draft. Projects archive through status. Media references in current content and revisions prevent deletion. Public media visibility follows references to published content, so unpublishing the only reference revokes public access immediately. Media RLS uses UUID-reference matching in document JSON; restrict new document types through schema validation.

## Authentication and actions

One CLI-provisioned owner, no sign-up. Password: scrypt with 128-bit random salt. Session: random 256-bit token, SHA-256 stored in PostgreSQL, 12-hour expiry, HttpOnly/SameSite=Strict cookie, Secure in production. Each studio page, layout, private action and upload route verifies the owner server-side. Login throttles IP bucket and normalized email. Server Actions use Next.js origin checks; upload mutation routes check Origin explicitly. SQL is parameterized; rich content is plain escaped strings and supported blocks, no executable HTML/SVG. Video embeds accept only strict YouTube-nocookie/Vimeo URLs. Errors do not reveal SQL or credentials to public visitors.

## Files and contact

Media files live outside `public/`. Request handler first checks session or public RLS visibility, then reads UUID-named disk files, with no-store caching to avoid stale publication access. Images have file-extension/decoded-format checks, size/pixel limits, rotation, resize to 2400px and WebP re-encoding without source metadata. SVG is rejected. PDFs require magic/EOF markers, reject obvious active/encrypted content, and always download as sandboxed attachments; this is not a general-purpose antivirus/PDF sanitizer. Owner should upload trusted documents only.

Contact validates Zod fields/consent/honeypot and a PostgreSQL atomic rate counter before inserting a private message. Only HMAC IP bucket keys are stored, not raw IP. `TRUST_PROXY=false` intentionally shares one bucket until a trusted reverse proxy is configured; production proxy overwrites forwarding headers. Message persistence precedes optional email relay. Provider acceptance is distinct from delivery; failures remain visible in inbox. Retention is explicit and applied by scheduled script, not a visit side effect.

## Rendering and operations

Public content and sitemap are dynamic: publish/unpublish is immediately reflected without a rebuild. Draft routes always 404 publicly; preview is inside authenticated studio. No shared HTML/media cache contains private content. i18n foundation provides ID/EN profile fields, locale metadata and explicit English fallback; complete UI translation is a future editorial pass. AI assistant is absent/disabled (Phase 2), and neural/flow visuals are decorative.

Standalone Node output supports Linux systemd or Docker with Nginx TLS. Durable PostgreSQL and media volumes require coordinated backups. Security headers include frame restrictions, MIME sniff prevention, a baseline CSP with allowlisted video hosts. Current Next inline bootstrap/dev runtime requires inline scripts; CSP is not nonce-strict and should be tightened for a dedicated production release after regression testing. No analytics/tracking library is installed.

Context7 references consulted: [Next standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), [cookies](https://nextjs.org/docs/app/api-reference/functions/cookies), [PostgreSQL 18 RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html). Lockfile captures resolved versions.
