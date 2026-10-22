import Link from "next/link";
import { getProfile, getSettings } from "@/lib/content";
import { Portrait } from "@/components/portrait";
import { PageIntro } from "@/components/shell";
export default async function About() {
  const [p, s] = await Promise.all([getProfile(), getSettings()]);
  return (
    <div className="container about-page">
      <PageIntro
        heading="h2"
        eyebrow="ABOUT / THE HUMAN SIDE"
        title="Behind the code."
      />
      <div className="about-layout">
        <Portrait
          id={p.aboutPortraitId}
          position={p.aboutPosition}
          variant="about"
        />
        <div className="about-copy" data-enter="scroll-guard">
          <p
            className="eyebrow"
            data-enter="label"
            style={{ animationDelay: "210ms" }}
          >
            {p.role}
          </p>
          <h2 data-enter="text" style={{ animationDelay: "280ms" }}>
            {p.name}
          </h2>
          <p
            className="story-text lede"
            data-enter="text"
            style={{ animationDelay: "350ms" }}
          >
            {s.locale === "id" && p.aboutId ? p.aboutId : p.about}
          </p>
          {p.location && <p className="mono">Based in {p.location}</p>}
          <div
            className="inline-links"
            data-enter="actions"
            style={{ animationDelay: "430ms" }}
          >
            <Link href="/#projects" className="button button-light">
              See my work ↗
            </Link>
            {p.resumeId && (
              <Link href="/resume" className="text-link">
                Download résumé ↗
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
