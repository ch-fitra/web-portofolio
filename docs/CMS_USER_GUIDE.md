# Owner Studio guide

Sign in at `/admin/login` using the owner account created on the server. All studio modules require this session. Sign out when finished; sessions expire after 12 hours. Reset from terminal with `npm run owner:setup`; old sessions are revoked. No public sign-up/reset email is offered.

## Profile, portraits, settings

Upload original images in Media Library and provide accurate alt text. Open Profile & portraits, select **Home portrait** and **About portrait** independently. The vertical crop positions (0–100) have separate previews; changing Home never overwrites About. Save profile to apply. Select an uploaded PDF to enable `/resume`; the route stays unavailable without a file. Edit identity, availability, public email/socials, English and Indonesian profile fields, and capabilities. Empty optional sections do not invent content.

Site Settings controls SEO defaults, contact headings/copy, footer, privacy, locale and default theme. Visitor theme preferences take precedence. Animation is always enabled, with no public or Studio motion toggle, as requested by the owner. Retention is an operational setting: update the privacy notice and configure the scheduled retention script; merely changing the value does not schedule a background job.

## Projects and chapters

1. Projects → New project. Choose a stable lowercase slug, category, role, collaboration type, context, personal contribution, summary and stack. Team/client/academic work must state your actual contribution and attribution.
2. Add chapter, edit title, add blocks. Supported blocks: text, heading, image, image pair, gallery, video, diagram image, code, quote, feature, stack, metric, CTA, divider. Move chapters and blocks using up/down buttons; disable a chapter to hide it. UUID anchors remain stable when reordered. Rich text is plain text with line breaks; HTML/code is escaped.
3. Select media from the library. Video requires `https://www.youtube-nocookie.com/embed/VIDEO_ID` or `https://player.vimeo.com/video/NUMBER`; add caption and transcript. Galleries open original images in a new tab. Metrics require an evidence source. No arbitrary scripts/HTML are accepted.
4. Save as draft → Preview saved version. Preview requires your login and shows only the last saved version. Draft is never a public URL.
5. Review copy, source rights, team contribution and links. Mark the demo verified only after checking it. Choose `published`, optionally Featured, Save. The project appears on public routes and sitemap immediately. Home displays up to three featured projects.
6. Select `draft` to unpublish, or `archived` to retain privately. Public detail becomes 404 and the sitemap entry disappears. Public media with no remaining published reference becomes private. To restore an archived project, select draft or published and save.

Previous versions are available after edits. Restore a version as draft, review and republish when ready. A duplicate can be made by creating a new project and reusing reviewed media; one-click duplication is not currently provided.

## Skills and certifications

Select an existing item or New. Edit fields and order; toggle Publicly visible to publish. Skills can link to evidence projects (public only shows published evidence). Certificates distinguish Certification from Course Completion and support issuer, dates, credential ID/link, image/PDF. Delete removes the item; hiding is reversible. No skill percentages or fabricated certificates are supplied.

## Media and inbox

Media accepts genuine JPG/PNG/WebP and non-active PDF up to 10 MB. Images are optimized and EXIF is removed. SVG and format spoofing are rejected. Edit alt text from the library. Delete is blocked while the asset is referenced by profile/project/record/revision, including private drafts. Remove all references before deleting; revision cleanup is an administrator operation. Files are not publicly served just because they were uploaded.

Inbox supports name/email/message search and status filter; mark unread/read/archived/spam or permanently delete. Notification `not_configured` means no relay was configured, `accepted` means the provider accepted the notification, `failed` means the email adapter failed. The inquiry remains in the inbox for all three. No email retry or outbound reply is sent automatically. The email link opens your own mail client.

## Before a public release

Provide two real portraits and verify all personal copy and contact links. Complete and review at least three real case studies, certify all claims/sources and mobile crops. Review privacy/retention, configure HTTPS/backups, and test the server. Full UI translation, production monitoring, full assistive-technology audit and Phase 2 AI are separate follow-ups.
