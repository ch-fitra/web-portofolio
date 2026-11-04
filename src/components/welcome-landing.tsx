"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { HomeCursorField } from "@/components/home-cursor-field";
import type { PortalOrigin } from "@/components/portal-transition";

const backdrop = "IDEAS INTO IMPACT · CODE WITH PURPOSE · HUMAN AT THE CORE ·";

export function WelcomeLanding({
  onEnter,
  entering = false,
}: {
  onEnter: (origin: PortalOrigin) => void;
  entering?: boolean;
}) {
  const entryButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (entering) return;
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key !== "Enter" ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const control =
        event.target instanceof Element
          ? event.target.closest(
              'input, textarea, select, a, button, [role="button"], [contenteditable]:not([contenteditable="false"])',
            )
          : null;
      if (control && control !== entryButton.current) return;
      event.preventDefault();
      entryButton.current?.click();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entering]);

  return (
    <div className="welcome-landing" data-entering={entering}>
      {!entering && <HomeCursorField surface=".welcome-landing" />}
      <div className="welcome-atmosphere" aria-hidden="true" />
      <div className="welcome-grid" aria-hidden="true" />

      <div className="welcome-marquee" aria-hidden="true">
        <div className="welcome-marquee-track">
          {[0, 1].map((copy) => (
            <div className="welcome-marquee-copy" key={copy}>
              {[0, 1].map((repeat) => (
                <span key={repeat}>{backdrop}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="welcome-center" aria-label="Welcome to the portfolio">
        <h1 className="welcome-title" aria-label="Welcome.">
          {Array.from("Welcome").map((letter, i) => (
            <span className="welcome-letter-mask" aria-hidden="true" key={i}>
              <span style={{ "--letter": i } as CSSProperties}>{letter}</span>
            </span>
          ))}
          <span className="welcome-period" aria-hidden="true">
            .
          </span>
        </h1>
        <p className="welcome-subtitle">
          A human behind the code.
          <br />
          <span>A world of possibilities ahead.</span>
        </p>
        <button
          ref={entryButton}
          type="button"
          className="welcome-enter"
          disabled={entering}
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            onEnter({
              x: box.left + box.width / 2,
              y: box.top + box.height / 2,
            });
          }}
        >
          Enter <ArrowUpRight size={19} aria-hidden="true" />
        </button>
      </section>

      <footer className="welcome-footer" aria-hidden="true">
        <span className="mono">IDEAS. SYSTEMS. HUMAN IMPACT.</span>
        <span className="welcome-footer-signal">
          <i /> MADE WITH INTENTION
        </span>
      </footer>
    </div>
  );
}
