"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { WelcomeLanding } from "@/components/welcome-landing";
import {
  PortalTransition,
  type PortalOrigin,
} from "@/components/portal-transition";

/** Enter lasts for this mounted visit only: a full refresh always welcomes again. */
export function PortfolioGateway({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  const [origin, setOrigin] = useState<PortalOrigin | null>(null);
  const started = useRef(false);
  const complete = useCallback(() => setEntered(true), []);
  function enter(point: PortalOrigin) {
    if (started.current) return;
    started.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) complete();
    else setOrigin(point);
  }

  useEffect(() => {
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
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const heading = document.querySelector<HTMLElement>("#home h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [entered]);

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
