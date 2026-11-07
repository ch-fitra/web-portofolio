# Owner Studio guide

Sign in at `/admin/login` with the server-only `ADMIN_PASSWORD` configured in `.env.local` (or the deployment environment). No email or account setup is required. Sign out when finished; sessions expire after 12 hours. Change `ADMIN_PASSWORD` and restart the server to rotate it: the old password and all existing sessions stop working. An unset/empty password disables login. No public sign-up/reset email is offered.

## Profile, portraits, settings

About uses a portrait, **Who I am**, and personal details. Edit **About (English)** in Profile & portraits; its Indonesian translation uses `aboutId`. Personal details use name, role, location, and university; location appears below the name, with the university alongside it under Education on desktop. Empty details are omitted. Email is shown in Contact. Older profiles remain compatible without a database migration.

Upload original images in Media Library and provide accurate alt text. Open Profile & portraits, select **Home portrait** and **About portrait** independently. The vertical crop positions (0–100) have separate previews; changing Home never overwrites About. Save profile to apply. Select an uploaded PDF to enable `/resume`; the route stays unavailable without a file. Edit identity, availability, public email/socials, English and Indonesian profile fields, and capabilities. Empty optional sections do not invent content.

Site Settings controls SEO defaults, contact headings/copy, footer, privacy, locale and default theme. Visitor theme preferences take precedence. Animation is always enabled, with no public or Studio motion toggle, as requested by the owner.

## Projects and chapters

The homepage carousel is a preview. **View all projects** opens the standalone `/projects` feed with search and filters. Project cards open `/projects/[slug]`. Main navigation returns to the selected homepage section using `/`, without URL hashes or replaying Welcome during internal navigation. A full homepage refresh still shows Welcome.

1. Projects → New project. Choose a stable lowercase slug, category, role, collaboration type, context, personal contribution, summary and stack. Team/client/academic work must state your actual contribution and attribution.
2. Add chapter, edit title, add blocks. Supported blocks: text, heading, image, image pair, gallery, video, diagram image, code, quote, feature, stack, metric, CTA, divider. Move chapters and blocks using up/down buttons; disable a chapter to hide it. UUID anchors remain stable when reordered. Rich text is plain text with line breaks; HTML/code is escaped.
3. Select media from the library. Video requires `https://www.youtube-nocookie.com/embed/VIDEO_ID` or `https://player.vimeo.com/video/NUMBER`; add caption and transcript. Galleries open original images in a new tab. Metrics require an evidence source. No arbitrary scripts/HTML are accepted.
4. Save as draft → Preview saved version. Preview requires your login and shows only the last saved version. Draft is never a public URL.
5. Review copy, source rights, team contribution and links. Mark the demo verified only after checking it. Choose `published`, optionally Featured, Save. The project appears on public routes and sitemap immediately. Home displays up to three featured projects.
6. Select `draft` to unpublish, or `archived` to retain privately. Public detail becomes 404 and the sitemap entry disappears. Public media with no remaining published reference becomes private. To restore an archived project, select draft or published and save.

Previous versions are available after edits. Restore a version as draft, review and republish when ready. A duplicate can be made by creating a new project and reusing reviewed media; one-click duplication is not currently provided.

## Skills and certifications

Skills displays a compact Tech stack with 32 technologies grouped into Programming Languages, Frontend, Backend, and Database. The four groups fit together in the Skills viewport; shorter screens use smaller icons and spacing, with a two-column layout in landscape. DevOps & Infrastructure is excluded from the public page. Edit, hide, reorder, or add items in Studio → Skills. Known names use bundled brand icons with color on hover; new names use a generic code icon. Published project evidence remains linked below its skill. Certificates appear only when published.

For a new database, run `npm run skills:import` to import the supplied list explicitly. Repeating the import does not duplicate names or overwrite existing skills, including hidden ones. The ordinary database seed does not publish skills automatically.

Select an existing item or New. Edit fields and order; toggle Publicly visible to publish. Skills can link to evidence projects (public only shows published evidence). Certificates distinguish Certification from Course Completion and support issuer, dates, credential ID/link, image/PDF. Delete removes the item; hiding is reversible. No skill percentages or fabricated certificates are supplied.

## Media and social contact

Media accepts genuine JPG/PNG/WebP and non-active PDF up to 10 MB. Images are optimized and EXIF is removed. SVG and format spoofing are rejected. Edit alt text from the library. Delete is blocked while the asset is referenced by profile/project/record/revision, including private drafts. Remove all references before deleting; revision cleanup is an administrator operation. Files are not publicly served just because they were uploaded.

Contact displays the GitHub, LinkedIn, Instagram, and email configured in Profile & portraits. Each channel has its own icon. Social links open the external profile; email opens the visitor's email app through a mailto link. There is no message form or Contact inbox in the portfolio.

## Before a public release

Provide two real portraits and verify all personal copy and contact links. Complete and review at least three real case studies, certify all claims/sources and mobile crops. Review privacy, configure HTTPS/backups, and test the server. Full UI translation, production monitoring, full assistive-technology audit and Phase 2 AI are separate follow-ups.
