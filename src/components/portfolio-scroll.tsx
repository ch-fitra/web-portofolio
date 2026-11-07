"use client";

import { useEffect, useRef } from "react";

export function PortfolioScroll({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // Contact and the real footer share the last viewport, including wrapped copy.
    const header = document.querySelector<HTMLElement>(".public-header");
    const footer = document.querySelector<HTMLElement>("body > .footer");
    const measure = () => {
      element.style.setProperty(
        "--portfolio-header-height",
        `${header?.getBoundingClientRect().height ?? 64}px`,
      );
      element.style.setProperty(
        "--portfolio-footer-height",
        `${footer?.getBoundingClientRect().height ?? 96}px`,
      );
    };
    const resize = new ResizeObserver(measure);
    if (header) resize.observe(header);
    if (footer) resize.observe(footer);
    measure();
    return () => resize.disconnect();
  }, []);
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
