"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export const replayIntroEvent = "portfolio:replay-intro";

export function PageEntrance({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const replay = (event: Event) => {
      const root = scope.current;
      if (!root) return;
      // Restart only entrance animations. Preserve form values, focus, and ambient effects.
      const section =
        event instanceof CustomEvent &&
        typeof event.detail?.section === "string"
          ? document.getElementById(event.detail.section)
          : null;
      (section && root.contains(section) ? section : root)
        .querySelectorAll<HTMLElement>("[data-enter]")
        .forEach((element) => {
          element.getAnimations().forEach((animation) => {
            if (
              animation instanceof CSSAnimation &&
              animation.animationName.startsWith("intro-")
            ) {
              animation.cancel();
              animation.play();
            }
          });
        });
      root.dataset.introReplays = String(
        Number(root.dataset.introReplays || 0) + 1,
      );
    };
    window.addEventListener(replayIntroEvent, replay);
    return () => window.removeEventListener(replayIntroEvent, replay);
  }, []);

  return (
    <div
      ref={scope}
      key={pathname}
      className="page-entrance"
      data-intro-route={pathname}
    >
      {children}
    </div>
  );
}
