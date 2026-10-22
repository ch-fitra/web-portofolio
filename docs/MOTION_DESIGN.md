## Single-page portfolio ? October 2026

The public landing page now contains Home, About, Projects, Skills, and Contact in that order. Sections occupy at least the available viewport and expand for longer published content. The document scrolls naturally; copy and contact forms no longer have nested scroll containers. The desktop rail and mobile top navigation remain available while scrolling. The active menu follows the section at the reading line and retains its size transition.

Anchor navigation uses smooth scrolling. IntersectionObserver restarts entrance animations when a section enters the viewport, independently of ambient portrait effects. Contact inputs remain mounted across section navigation. Old public section routes redirect to root anchors; individual project stories and privacy remain separate documents.

# Public page introductions

Direction: an editorial staggered reveal that fits the graphite design. Labels arrive first, headings rise through a line mask, supporting copy and actions follow, and portraits enter with a restrained rise/scale. The navigation stays immediately usable; there is no fullscreen loading overlay or scroll lock beyond the owner's existing single-screen layouts.

| Element | Typical delay | Duration |
|---|---:|---:|
| Eyebrow/availability | 0–60ms | 550ms |
| Heading lines | 90–180ms | 800ms |
| Portrait | 160–170ms | 900ms |
| Description/panel | 230–350ms | 700ms |
| Actions/metadata | 350–500ms | 700ms |

Easing: `cubic-bezier(.22, 1, .36, 1)`. Animated properties are opacity and transform, without expensive full-page blur or layout changes. Each heading line has a mask with descender space. Portrait rotation stays on its existing nested element, separate from the entrance transform. Explicit CSS target attributes keep decorative loops and hover effects separate.

Home/About copy uses a discrete 1250ms scroll guard: clip only while the entrance is moving, then restore its normal overflow behavior. This prevents a temporary scrollbar from translated elements while retaining the long-content fallback. The guard restarts along with the introduction.

`PageEntrance` uses the current pathname as the content key so introductions restart on navigation and return visits, including deeper project URLs. Its wrapper uses `display: contents` to preserve fixed-page sizing and chapter layouts. CSS starts the entrance from the server-rendered markup, including initial page loads. Clicking the currently active navigation link dispatches a replay event: only named introduction animations are restarted using the native Web Animations API. Form values, focus state and ambient effects are preserved. Modified clicks still support opening links in another tab.

Public coverage: Home, About, Projects, Skills, Contact, Privacy and project detail content. No motion switch is exposed, matching the owner's latest preference. Owner Studio workflows are not wrapped in these public introductions.

References consulted through web search/Context7 and installed Next.js documentation:

- [Motion entrance animations and stagger](https://motion.dev/docs/react-animation)
- [Motion timing, easing and transitions](https://motion.dev/docs/react-transitions)
- [web.dev: high-performance CSS animation](https://web.dev/articles/animations-guide)
- Installed Next.js guidance for pathname hooks and remounting templates.
