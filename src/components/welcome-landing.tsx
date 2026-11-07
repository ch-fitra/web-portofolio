"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { HomeCursorField } from "@/components/home-cursor-field";
import type { PortalOrigin } from "@/components/portal-transition";

const backdrop = "IDEAS INTO IMPACT · CODE WITH PURPOSE · HUMAN AT THE CORE ·";

const welcomeMessages = [
  {
    title: "Welcome",
    subtitle: "Thanks for stopping by my portfolio.",
    detail: "Let me introduce myself.",
    scale: 1,
  },
  {
    title: "I'm Fitra",
    subtitle: "Chairul Fitra Ramadhan.",
    detail: "The person behind the code.",
    scale: 0.85,
  },
  {
    title: "AI & Code",
    subtitle: "I build AI-powered applications.",
    detail: "Full-stack development & intelligent automation.",
    scale: 0.8,
  },
  {
    title: "Let's explore",
    subtitle: "Discover my projects and the thinking behind them.",
    detail: "Step inside and get to know my work.",
    scale: 0.62,
  },
];

export function WelcomeLanding({
  onEnter,
  entering = false,
}: {
  onEnter: (origin: PortalOrigin) => void;
  entering?: boolean;
}) {
  const entryButton = useRef<HTMLButtonElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const message = welcomeMessages[wordIndex];
  const word = message.title;
  const subtitleIndex = fading
    ? (wordIndex + 1) % welcomeMessages.length
    : wordIndex;

  useEffect(() => {
    if (entering) return;
    let swapTimer: number | undefined;
    const holdTimer = window.setTimeout(() => {
      setFading(true);
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      swapTimer = window.setTimeout(
        () => {
          setWordIndex((index) => (index + 1) % welcomeMessages.length);
          setFading(false);
        },
        reducedMotion ? 0 : 350,
      );
    }, 5000);
    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(swapTimer);
    };
  }, [wordIndex, entering]);

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
        <h1
          className="welcome-title"
          aria-label={`${word}.`}
          data-fading={fading}
          style={{ "--title-scale": message.scale } as CSSProperties}
        >
          {Array.from(word).map((letter, i) => (
            <span
              className="welcome-letter-mask"
              aria-hidden="true"
              key={`${word}-${i}`}
            >
              <span style={{ "--letter": i } as CSSProperties}>{letter}</span>
            </span>
          ))}
          <span className="welcome-period" aria-hidden="true">
            .
          </span>
        </h1>
        <div className="welcome-subtitles">
          {welcomeMessages.map((item, index) => (
            <p
              key={item.title}
              className="welcome-subtitle"
              aria-hidden={index !== subtitleIndex}
              data-position={
                index === subtitleIndex
                  ? "active"
                  : index ===
                      (subtitleIndex + welcomeMessages.length - 1) %
                        welcomeMessages.length
                    ? "previous"
                    : "next"
              }
            >
              {item.subtitle}
              <br />
              <span>{item.detail}</span>
            </p>
          ))}
        </div>
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
