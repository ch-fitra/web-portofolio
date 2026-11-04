# Architecture

Next.js App Router 16 + React 19 + TypeScript; server components render SEO content, client components handle chapter editing, filters, theme/motion, form status and Motion reveals. Tailwind 4 with CSS tokens implements Graphite Intelligence. No microservices or platform hosting/auth/storage dependencies.

## Data and trust boundaries

`pg` pools use three distinct logins. `portfolio_public` only SELECTs public documents, published projects, visible skill/certification records and media referenced by public content. `portfolio_owner` edits content/media/revisions but cannot read passwords/sessions. `portfolio_auth` only manages the single owner credential, hashed sessions and rate-limit counters. Migration credentials create roles/tables and never belong in production runtime. Every table has ENABLE + FORCE ROW LEVEL SECURITY; runtime roles are non-superuser/non-BYPASSRLS and do not own tables. No SET ROLE membership is granted. Policies use actual PostgreSQL roles rather than forgeable application flags. Contact is display-only and links directly to external social profiles.

`documents` stores schema-validated profile/settings JSONB; `projects` has indexed slug/status and typed chapter/block JSONB. Chapters and blocks are ordered arrays with stable UUID anchors. `records` stores validated skills/certifications. This intentionally consolidates the PRD’s normalized chapter/block tables for a single-owner CMS; all business copy remains in data. Revisions save previous project documents before edits; restoration always creates a draft. Projects archive through status. Media references in current content and revisions prevent deletion. Public media visibility follows references to published content, so unpublishing the only reference revokes public access immediately. Media RLS uses UUID-reference matching in document JSON; restrict new document types through schema validation.

## Authentication and actions

One owner, no sign-up. Password-only login compares the submitted password against server-only `ADMIN_PASSWORD` using constant-time SHA-256 digest comparison. The singleton owner identity is created on the first successful login; legacy database password hashes are not accepted. Session: random 256-bit token, password-keyed HMAC-SHA-256 digest stored in PostgreSQL, 12-hour expiry, HttpOnly/SameSite=Strict cookie, Secure in production. Rotating the environment password and restarting the server invalidates all prior cookies without a schema change. Missing configuration fails closed. Each studio page, layout, private action and upload route verifies the owner server-side. Login throttles both IP and shared studio buckets. Server Actions use Next.js origin checks; upload mutation routes check Origin explicitly. SQL is parameterized; rich content is escaped plain text, no executable HTML/SVG. Video embeds accept only strict YouTube-nocookie/Vimeo URLs. Errors do not reveal SQL or credentials.

## Files and contact

Media files live outside `public/`. Request handler first checks session or public RLS visibility, then reads UUID-named disk files, with no-store caching to avoid stale publication access. Images have file-extension/decoded-format checks, size/pixel limits, rotation, resize to 2400px and WebP re-encoding without source metadata. SVG is rejected. PDFs require magic/EOF markers, reject obvious active/encrypted content, and always download as sandboxed attachments; this is not a general-purpose antivirus/PDF sanitizer. Owner should upload trusted documents only.

Contact contains external social profile links only. There is no visitor message form, submission server action, inbox route, or email relay. Historical message tables are retained for compatibility; application code no longer reads or writes them.

## Rendering and operations

Public content and sitemap are dynamic: publish/unpublish is immediately reflected without a rebuild. Draft routes always 404 publicly; preview is inside authenticated studio. No shared HTML/media cache contains private content. i18n foundation provides ID/EN profile fields, locale metadata and explicit English fallback; complete UI translation is a future editorial pass. AI assistant is absent/disabled (Phase 2), and neural/flow visuals are decorative.

Standalone Node output supports Linux systemd or Docker with Nginx TLS. Durable PostgreSQL and media volumes require coordinated backups. Security headers include frame restrictions, MIME sniff prevention, a baseline CSP with allowlisted video hosts. Current Next inline bootstrap/dev runtime requires inline scripts; CSP is not nonce-strict and should be tightened for a dedicated production release after regression testing. No analytics/tracking library is installed.

Context7 references consulted: [Next standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), [cookies](https://nextjs.org/docs/app/api-reference/functions/cookies), [PostgreSQL 18 RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html). Lockfile captures resolved versions.
