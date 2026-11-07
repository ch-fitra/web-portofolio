"use client";

import {
  PortfolioSectionLink,
  usePortfolioNavigation,
} from "./portfolio-navigation";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { replayIntroEvent } from "./page-entrance";

const pages = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
] as const;

export function SideNavigation() {
  const pathname = usePathname();
  const { rememberSection } = usePortfolioNavigation();
  const [section, setSection] = useState("home");
  useEffect(() => {
    if (pathname !== "/") return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = [
        ...document.querySelectorAll<HTMLElement>(".portfolio-section"),
      ];
      const line = Math.min(window.innerHeight * 0.35, 240);
      const current =
        sections
          .filter((item) => item.getBoundingClientRect().top <= line)
          .at(-1) || sections[0];
      const matched = pages.find((page) => page.id === current?.id);
      if (matched) {
        setSection(matched.id);
        rememberSection(matched.id);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname, rememberSection]);

  if (pathname !== "/") return null;

  return (
    <nav className="side-navigation" aria-label="Main navigation">
      <div className="side-navigation-links">
        {pages.map(({ id, label }) => {
          const active = section === id;
          return (
            <PortfolioSectionLink
              key={id}
              section={id}
              className="side-nav-link"
              aria-current={active ? "location" : undefined}
              onClick={(event) => {
                if (
                  pathname === "/" &&
                  !event.metaKey &&
                  !event.ctrlKey &&
                  !event.shiftKey &&
                  !event.altKey
                ) {
                  if (active)
                    window.dispatchEvent(
                      new CustomEvent(replayIntroEvent, {
                        detail: { section: id },
                      }),
                    );
                }
              }}
            >
              <span className="side-nav-label">{label}</span>
              <span className="side-nav-marker" aria-hidden="true" />
            </PortfolioSectionLink>
          );
        })}
      </div>
    </nav>
  );
}
