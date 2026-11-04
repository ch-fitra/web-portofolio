import Link from "next/link";
import { ArrowUpRight, Workflow } from "lucide-react";
import { getProfile, getSettings } from "@/lib/content";
import { Portrait } from "@/components/portrait";
import { HomeCursorField } from "@/components/home-cursor-field";
import { HomeHeadline } from "@/components/home-headline";
export default async function Home() {
  const [p, s] = await Promise.all([getProfile(), getSettings()]);
  const headline =
    s.locale === "id" && p.headlineId ? p.headlineId : p.headline;
  const intro = s.locale === "id" && p.introId ? p.introId : p.intro;
  return (
    <div className="container home-page">
      <HomeCursorField />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: {
              "@type": "Person",
              name: p.name,
              url: process.env.SITE_URL || "http://localhost:3000",
              sameAs: [p.github, p.linkedin, p.instagram].filter(Boolean),
            },
          }).replaceAll("<", "\\u003c"),
        }}
      />
      <section className="hero">
        <div className="home-ambient" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="hero-copy" data-enter="scroll-guard">
          <p
            className="hero-introduction"
            data-enter="text"
            style={{ animationDelay: "60ms" }}
          >
            Hello, I’m <span>{p.name.split(" ").slice(0, 2).join(" ")}.</span>
          </p>
          <HomeHeadline text={headline} locale={s.locale} />
          <p
            className="hero-description"
            data-enter="text"
            style={{ animationDelay: "270ms" }}
          >
            {intro}
          </p>
          <div
            className="hero-buttons"
            data-enter="actions"
            style={{ animationDelay: "350ms" }}
          >
            <Link className="button button-light" href="/#projects">
              Explore the work <ArrowUpRight size={18} />
            </Link>
            <Link className="button button-outline" href="/#contact">
              Hire me <ArrowUpRight size={16} />
            </Link>
          </div>
          <div
            className="hero-footnote"
            data-enter="text"
            style={{ animationDelay: "430ms" }}
          >
            <span className="mono">{p.role.toUpperCase()}</span>
            <i />
            <span>Logic meets possibility.</span>
          </div>
        </div>
        <div
          className="hero-visual"
          data-enter="portrait"
          style={{ animationDelay: "170ms" }}
        >
          <Portrait id={p.homePortraitId} position={p.homePosition} />
          <div
            className="signal-tag"
            data-enter="signal"
            style={{ animationDelay: "480ms" }}
          >
            <Workflow size={19} />
            <div>
              <span className="mono">IDEA → SYSTEM → IMPACT</span>
              <small>Built around real problems.</small>
            </div>
          </div>
        </div>
      </section>
      <div
        className="hero-bottom"
        data-enter="text"
        style={{ animationDelay: "500ms" }}
      >
        <span className="mono">APPLIED INTELLIGENCE / HUMAN INTENTION</span>
        <div className="home-socials">
          {p.github && (
            <a href={p.github} target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight size={13} />
            </a>
          )}
          {p.linkedin && (
            <a href={p.linkedin} target="_blank" rel="noreferrer">
              LinkedIn <ArrowUpRight size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
