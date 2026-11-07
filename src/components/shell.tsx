import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Preferences } from "./preferences";
import { SideNavigation } from "./side-navigation";
import { PortfolioSectionLink } from "./portfolio-navigation";
import type { Profile, Settings } from "@/lib/schema";
export function Header() {
  return (
    <header className="header public-header">
      <SideNavigation />
      <div className="container header-inner">
        <div className="header-actions">
          <Preferences />
        </div>
      </div>
    </header>
  );
}
export function Footer({
  profile,
  settings,
}: {
  profile: Profile;
  settings: Settings;
}) {
  return (
    <footer className="footer container">
      <div>
        <PortfolioSectionLink section="home" className="wordmark">
          {profile.handle}
          <span className="tiny-dot" />
        </PortfolioSectionLink>
        <p>{settings.footer}</p>
      </div>
      <div className="footer-links">
        <Link href="/privacy">Privacy</Link>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
  heading = "h1",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  heading?: "h1" | "h2";
}) {
  const Heading = heading;
  return (
    <div className="page-intro">
      <p className="eyebrow" data-enter="label">
        <span /> {eyebrow}
      </p>
      <Heading>
        {title.split("\n").map((line, index) => (
          <span className="intro-line" key={index}>
            <span
              data-enter="title"
              style={{ animationDelay: `${90 + index * 80}ms` }}
            >
              {line}
            </span>
          </span>
        ))}
      </Heading>
      {description && (
        <p
          className="lede"
          data-enter="text"
          style={{ animationDelay: "240ms" }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
export function ContactCTA() {
  return (
    <section className="contact-cta">
      <p className="eyebrow">NEXT / A CONVERSATION</p>
      <h2>
        Have something
        <br />
        <span className="muted">in mind?</span>
      </h2>
      <PortfolioSectionLink className="button button-light" section="contact">
        Let’s build something <ArrowUpRight size={18} />
      </PortfolioSectionLink>
    </section>
  );
}
