import { Workflow } from "lucide-react";
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
    </div>
  );
}
