"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { replayIntroEvent } from "./page-entrance";

const pages = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#projects", label: "Projects" },
  { href: "/#skills", label: "Skills" },
  { href: "/#contact", label: "Contact" },
];

export function SideNavigation() {
  const pathname = usePathname();
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
      if (current) setSection(current.id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return (
    <nav className="side-navigation" aria-label="Main navigation">
      <div className="side-navigation-links">
        {pages.map(({ href, label }) => {
          const id = href.slice(2);
          const active =
            pathname === "/" ? section === id : pathname.startsWith(`/${id}`);
          return (
            <Link
              key={href}
              href={href}
              className="side-nav-link"
              aria-current={
                active ? (pathname === "/" ? "location" : "page") : undefined
              }
              onClick={(event) => {
                if (
                  pathname === "/" &&
                  !event.metaKey &&
                  !event.ctrlKey &&
                  !event.shiftKey &&
                  !event.altKey
                ) {
                  event.preventDefault();
                  const target = document.getElementById(id);
                  if (target) {
                    history.pushState(null, "", `${location.search}#${id}`);
                    target.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                    if (active)
                      window.dispatchEvent(new Event(replayIntroEvent));
                  }
                }
              }}
            >
              <span className="side-nav-label">{label}</span>
              <span className="side-nav-marker" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
