import Image from "next/image";
import type { Project, Block } from "@/lib/schema";
import { getMedia } from "@/lib/content";
export async function ContentBlock({
  block,
  preview = false,
}: {
  block: Block;
  preview?: boolean;
}) {
  const media = block.mediaId ? await getMedia(block.mediaId, preview) : null;
  const picture = media ? (
    <figure>
      <Image
        src={`/media/${media.id}`}
        alt={media.alt}
        width={media.width || 1200}
        height={media.height || 800}
        unoptimized
        className="story-image"
      />
      <figcaption>{block.caption}</figcaption>
    </figure>
  ) : (
    <p className="muted">Image unavailable.</p>
  );
  switch (block.type) {
    case "heading":
      return <h3>{block.title || block.text}</h3>;
    case "text":
      return <p className="story-text">{block.text}</p>;
    case "image":
    case "diagram":
      return picture;
    case "image-pair":
    case "gallery":
      return (
        <div className="gallery">
          {await Promise.all(
            block.mediaIds.map(async (id) => {
              const m = await getMedia(id, preview);
              return m ? (
                <a
                  key={id}
                  href={`/media/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open image: ${m.alt}`}
                >
                  <Image
                    src={`/media/${id}`}
                    alt={m.alt}
                    width={m.width || 900}
                    height={m.height || 600}
                    unoptimized
                    className="story-image"
                  />
                </a>
              ) : null;
            }),
          )}
        </div>
      );
    case "video":
      return (
        <figure>
          <iframe
            src={block.url}
            title={block.title || "Project demonstration"}
            loading="lazy"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <figcaption>{block.caption}</figcaption>
          {block.text && (
            <details>
              <summary>Video transcript</summary>
              <p className="story-text">{block.text}</p>
            </details>
          )}
        </figure>
      );
    case "code":
      return (
        <pre>
          <code>{block.text}</code>
        </pre>
      );
    case "quote":
      return (
        <blockquote>
          {block.text}
          <cite>{block.source}</cite>
        </blockquote>
      );
    case "stack":
      return (
        <div className="chips">
          {block.items.map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      );
    case "metric":
      return (
        <div className="metric">
          <strong>{block.title}</strong>
          <p>{block.text}</p>
          <small>Source: {block.source}</small>
        </div>
      );
    case "feature":
      return (
        <div className="feature-block">
          <h3>{block.title}</h3>
          <p>{block.text}</p>
        </div>
      );
    case "cta":
      return block.url ? (
        <a
          className="button button-light"
          href={block.url}
          rel="noreferrer"
          target="_blank"
        >
          {block.title || "Explore"} ↗
        </a>
      ) : null;
    case "divider":
      return <hr />;
  }
}
export async function ProjectStory({
  project,
  preview = false,
}: {
  project: Project;
  preview?: boolean;
}) {
  const chapters = project.chapters.filter((c) => c.visible);
  return (
    <>
      <section
        className="quick-read"
        data-enter="panel"
        style={{ animationDelay: "300ms" }}
      >
        <div>
          <p className="eyebrow">THE QUICK READ</p>
          <h2>{project.summary}</h2>
        </div>
        <dl>
          <div>
            <dt>My role</dt>
            <dd>{project.role}</dd>
          </div>
          <div>
            <dt>Context</dt>
            <dd>
              {project.collaboration} · {project.context}
            </dd>
          </div>
          <div>
            <dt>Personal contribution</dt>
            <dd>{project.contribution}</dd>
          </div>
          {project.team && (
            <div>
              <dt>Team</dt>
              <dd>{project.team}</dd>
            </div>
          )}
        </dl>
      </section>
      <div className="story-layout">
        <aside className="chapter-nav">
          <p className="eyebrow">IN THIS CASE STUDY</p>
          <nav aria-label="Project chapters">
            {chapters.map((c, i) => (
              <a key={c.id} href={`#chapter-${c.id}`}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {c.title}
              </a>
            ))}
          </nav>
          <div className="chapter-progress" aria-hidden="true" />
        </aside>
        <div>
          {await Promise.all(
            chapters.map(async (c, i) => (
              <section key={c.id} id={`chapter-${c.id}`} className="chapter">
                <p className="eyebrow">
                  CHAPTER {String(i + 1).padStart(2, "0")}
                </p>
                <h2>{c.title}</h2>
                {await Promise.all(
                  c.blocks.map(async (b) => (
                    <ContentBlock key={b.id} block={b} preview={preview} />
                  )),
                )}
                {chapters[i + 1] && (
                  <a
                    className="text-link"
                    href={`#chapter-${chapters[i + 1].id}`}
                  >
                    Next chapter: {chapters[i + 1].title} ↓
                  </a>
                )}
              </section>
            )),
          )}
        </div>
      </div>
    </>
  );
}
