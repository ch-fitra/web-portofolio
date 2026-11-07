"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

type Section = "home" | "about" | "skills" | "projects" | "contact";
type Navigation = {
  entered: boolean;
  enter: () => void;
  requestSection: (section: Section) => void;
  rememberSection: (section: Section) => void;
  consumeSection: () => Section | null;
};
const Context = createContext<Navigation | null>(null);

/** Persists only across internal routes. A full refresh starts at Welcome again. */
export function PortfolioNavigation({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  const pending = useRef<Section | null>(null);
  const lastSection = useRef<Section>("home");
  const rememberSection = useCallback((section: Section) => {
    lastSection.current = section;
  }, []);
  const enter = useCallback(() => setEntered(true), []);
  const requestSection = useCallback((section: Section) => {
    pending.current = section;
    lastSection.current = section;
    setEntered(true);
  }, []);
  const consumeSection = useCallback(() => {
    const section = pending.current ?? lastSection.current;
    pending.current = null;
    return section;
  }, []);
  return (
    <Context.Provider
      value={{
        entered,
        enter,
        requestSection,
        consumeSection,
        rememberSection,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function usePortfolioNavigation() {
  const value = useContext(Context);
  if (!value) throw Error("Portfolio navigation provider is missing.");
  return value;
}

export function PortfolioSectionLink({
  section,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { section: Section }) {
  const pathname = usePathname();
  const { requestSection, rememberSection } = usePortfolioNavigation();
  return (
    <Link
      {...props}
      href="/"
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        )
          return;
        if (pathname === "/") {
          const target = document.getElementById(section);
          if (target) {
            event.preventDefault();
            rememberSection(section);
            target.scrollIntoView({
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
              block: "start",
            });
          }
        } else requestSection(section);
      }}
    />
  );
}
