"use client";

import { useEffect, useRef } from "react";

export function PortfolioScroll({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sections =
      root.current?.querySelectorAll<HTMLElement>(".portfolio-section");
    if (!sections) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target
            .querySelectorAll<HTMLElement>("[data-enter]")
            .forEach((element) => {
              element.getAnimations().forEach((animation) => {
                if (
                  animation instanceof CSSAnimation &&
                  animation.animationName.startsWith("intro-") &&
                  animation.animationName !== "intro-scroll-guard"
                ) {
                  animation.cancel();
                  animation.play();
                }
              });
            });
        });
      },
      { rootMargin: "-64px 0px -12% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={root} className="single-page-portfolio">
      {children}
    </div>
  );
}
