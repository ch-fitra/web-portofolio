"use client";

import { useEffect, useRef } from "react";

const variations = {
  en: [
    "Human ideas.\nIntelligent solutions.",
    "Useful automation.\nMore room to create.",
    "Complex problems.\nClear, thoughtful code.",
    "Built with purpose.\nMade for people.",
  ],
  id: [
    "Ide manusia.\nSolusi cerdas.",
    "Otomasi berguna.\nRuang untuk berkarya.",
    "Masalah kompleks.\nKode yang jelas.",
    "Dibangun bermakna.\nUntuk manusia.",
  ],
};
const tones = ["cyan", "violet", "mint", "amber", "rose"];

export function HomeHeadline({
  text,
  locale = "en",
}: {
  text: string;
  locale?: "en" | "id";
}) {
  const phrases = [text, ...variations[locale]];
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = ref.current;
    if (!heading) return;
    const panels = Array.from(
      heading.querySelectorAll<HTMLElement>(".headline-phrase"),
    );
    const letters = panels.map((panel) =>
      Array.from(panel.querySelectorAll<HTMLElement>(".typing-character")),
    );
    let active = 0;
    let characters = letters[active];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout>;
    let visible = false;
    let count = characters.length;
    let phase: "hold" | "erase" | "type" = "hold";

    function paint() {
      panels.forEach((panel, i) =>
        panel.toggleAttribute("data-active", i === active),
      );
      heading!.dataset.tone = tones[active];
      characters.forEach((character, i) => {
        character.style.visibility = i < count ? "visible" : "hidden";
        character.toggleAttribute("data-caret", i === count - 1);
      });
      heading!.dataset.phase = phase;
    }

    function tick() {
      if (phase === "hold") phase = "erase";
      if (phase === "erase") {
        count = Math.max(0, count - 1);
        paint();
        if (count === 0) {
          active = (active + 1) % panels.length;
          characters = letters[active];
          phase = "type";
          paint();
          timer = setTimeout(tick, 500);
        } else timer = setTimeout(tick, 28);
      } else {
        count = Math.min(characters.length, count + 1);
        if (count === characters.length) phase = "hold";
        paint();
        // Pause at punctuation to give the typing a natural rhythm.
        const punctuation = /[.,!?]$/.test(
          characters[count - 1]?.textContent || "",
        );
        timer = setTimeout(
          tick,
          phase === "hold" ? 4800 : punctuation ? 260 : 65,
        );
      }
    }

    function sync() {
      clearTimeout(timer);
      if (reduced.matches) active = 0;
      characters = letters[active];
      count = characters.length;
      phase = "hold";
      paint();
      if (visible && !document.hidden && !reduced.matches) {
        timer = setTimeout(tick, 4800);
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(heading);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [text, locale]);

  return (
    <h1
      ref={ref}
      className="home-typing-headline"
      aria-label={text.replaceAll("\n", " ")}
      data-phase="hold"
      data-tone="cyan"
    >
      {phrases.map((phrase, index) => (
        <span
          key={index}
          className="headline-phrase"
          data-active={index === 0 ? "" : undefined}
          aria-hidden="true"
        >
          {phrase.split("\n").map((line, i) => (
            <span key={i} className={`intro-line ${i ? "muted" : ""}`}>
              <span
                data-enter="title"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                <span className="home-title-ink">
                  {Array.from(
                    new Intl.Segmenter(undefined, {
                      granularity: "grapheme",
                    }).segment(line),
                    ({ segment }, j) => (
                      <span className="typing-character" key={j}>
                        {segment}
                      </span>
                    ),
                  )}
                </span>
              </span>
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
