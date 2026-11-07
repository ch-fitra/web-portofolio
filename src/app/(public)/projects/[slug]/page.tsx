import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getProject } from "@/lib/content";
import { ProjectStory } from "@/components/chapters";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  return p
    ? {
        title: p.seoTitle || p.title,
        description: p.seoDescription || p.summary,
        alternates: { canonical: `/projects/${p.slug}` },
        openGraph: {
          title: p.title,
          description: p.summary,
          ...(p.coverId ? { images: [`/media/${p.coverId}`] } : {}),
        },
      }
    : { title: "Project not found" };
}
export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) notFound();
  return (
    <div className="container">
      <header className="project-intro" data-enter="panel">
        <Link className="text-link" href="/projects">
          ← Back to the work
        </Link>
        <p className="eyebrow">
          {p.category} / {p.collaboration} PROJECT
        </p>
        <h1>{p.title}</h1>
        <p className="lede">{p.summary}</p>
        <div className="chips">
          {p.stack.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        <div className="inline-links">
          {p.sourceUrl && (
            <a
              className="text-link"
              href={p.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Source code ↗
            </a>
          )}
          {p.demoUrl && p.demoVerified ? (
            <a
              className="text-link"
              href={p.demoUrl}
              target="_blank"
              rel="noreferrer"
            >
              View demo ↗
            </a>
          ) : (
            <span className="muted mono">Demo unavailable</span>
          )}
        </div>
      </header>
      {p.coverId && (
        <Image
          className="story-image project-hero-cover"
          data-enter="portrait"
          style={{ animationDelay: "180ms" }}
          src={`/media/${p.coverId}`}
          alt={`${p.title} cover`}
          width={1600}
          height={900}
          unoptimized
          priority
        />
      )}
      <ProjectStory project={p} />
    </div>
  );
}
