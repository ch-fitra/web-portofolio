"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { WelcomeLanding } from "@/components/welcome-landing";
import { usePortfolioNavigation } from "./portfolio-navigation";
import {
  PortalTransition,
  type PortalOrigin,
} from "@/components/portal-transition";

/** Entry persists across internal routes; a full refresh always welcomes again. */
export function PortfolioGateway({ children }: { children: ReactNode }) {
  const { entered, enter: complete, consumeSection } = usePortfolioNavigation();
  const returning = useRef(entered);
  const destination = useRef<string | null>(null);
  const [origin, setOrigin] = useState<PortalOrigin | null>(null);
  const started = useRef(false);
  function enter(point: PortalOrigin) {
    if (started.current) return;
    started.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) complete();
    else setOrigin(point);
  }

  useEffect(() => {
    if (returning.current) return;
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    history.replaceState(
      history.state,
      "",
      location.pathname + location.search,
    );
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return () => {
      history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    if (!entered) return;
    const section =
      destination.current ??
      consumeSection() ??
      (returning.current ? "restore" : "home");
    destination.current = section;
    if (section === "restore") return;
    document
      .getElementById(section)
      ?.scrollIntoView({ block: "start", behavior: "instant" });
    const heading = document.querySelector<HTMLElement>(
      `#${section} :is(h1, h2)`,
    );
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [entered, consumeSection]);

  return (
    <>
      {(origin || entered) && (
        <div
          className="gateway-destination"
          data-arriving={!entered}
          inert={!entered}
        >
          {children}
        </div>
      )}
      {!entered && <WelcomeLanding onEnter={enter} entering={!!origin} />}
      {!entered && origin && (
        <PortalTransition origin={origin} onComplete={complete} />
      )}
      {!!origin && !entered && (
        <span className="portal-status" role="status">
          Entering portfolio…
        </span>
      )}
    </>
  );
}
