"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/schema";
import {
  advanceCarousel,
  carouselScale,
  wrapCarousel,
} from "@/lib/carousel-motion";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const media = matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function ProjectCarousel({ projects }: { projects: Project[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const engine = useRef({ position: 0, velocity: -28 });
  const navigate = useRef<(direction: number) => void>(() => {});
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => matchMedia(motionQuery).matches,
    () => false,
  );
  // Enough copies to fill wide screens, even when only two projects are published.
  const copies = projects.length > 1 ? Math.ceil(11 / projects.length) : 1;
  const slots = Array.from({ length: copies }, () => projects).flat();

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const cards = Array.from(
      element.querySelectorAll<HTMLElement>(".orbit-card"),
    );
    const links = cards.map((card) =>
      card.querySelector<HTMLAnchorElement>("a")!,
    );
    const state = engine.current;
    let width = 0;
    let step = 0;
    let visible = false;
    let focused = false;
    let frame = 0;
    let lastTime = 0;
    let target: number | null = null;
    let suppressClick = false;
    let drag: {
      id: number;
      startX: number;
      startY: number;
      x: number;
      time: number;
      velocity: number;
      active: boolean;
    } | null = null;
    const single = projects.length === 1;

    function render() {
      element!.dataset.ready = "true";
      const span = cards.length * step;
      cards.forEach((card, index) => {
        const x = single
          ? 0
          : wrapCarousel(index * step + state.position, span);
        const scale = single ? 1 : carouselScale(x, step);
        card.style.transform = `translate3d(${x}px, ${12 * (1 - scale)}px, 0) scale(${scale})`;
        card.style.opacity = String(0.45 + 0.55 * ((scale - 0.58) / 0.42));
        card.style.zIndex = String(Math.round(scale * 100));
        const onScreen = Math.abs(x) < width / 2 + step * 0.65;
        card.style.visibility = onScreen ? "visible" : "hidden";
        // Only the central copy is a tab stop; controls expose every project.
        links[index].tabIndex = Math.abs(x) < step / 2 ? 0 : -1;
        card.setAttribute("aria-hidden", String(!onScreen));
      });
    }

    const resize = new ResizeObserver(() => {
      const previousStep = step;
      width = element!.clientWidth;
      const cardWidth = cards[0].offsetWidth;
      step = cardWidth * 0.88 + 16;
      if (previousStep) state.position = (state.position / previousStep) * step;
      target = null;
      render();
    });
    resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      lastTime = 0;
    });
    observer.observe(element);

    function animate(time: number) {
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.04) : 0;
      lastTime = time;
      if (visible && !document.hidden && step && !single) {
        if (target !== null) {
          state.velocity += (target - state.position) * 100 * dt;
          state.velocity *= Math.exp(-18 * dt);
          state.position += state.velocity * dt;
          if (
            Math.abs(target - state.position) < 0.15 &&
            Math.abs(state.velocity) < 1
          ) {
            state.position = target;
            state.velocity = -28;
            target = null;
            if (focused) {
              const center = cards.findIndex(
                (_, index) =>
                  Math.abs(
                    wrapCarousel(
                      index * step + state.position,
                      cards.length * step,
                    ),
                  ) < 1,
              );
              links[center]?.focus({ preventScroll: true });
            }
          }
        } else if (!drag && !focused && !reduced) {
          Object.assign(
            state,
            advanceCarousel(state.position, state.velocity, dt),
          );
          state.position = wrapCarousel(state.position, cards.length * step);
        }
        render();
      }
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);

    navigate.current = (direction) => {
      if (single) return;
      const next =
        (Math.round((target ?? state.position) / step) - direction) * step;
      state.velocity = 0;
      if (reduced) {
        state.position = next;
        render();
        if (focused) {
          const center = cards.findIndex(
            (_, index) =>
              Math.abs(
                wrapCarousel(
                  index * step + state.position,
                  cards.length * step,
                ),
              ) < 1,
          );
          links[center]?.focus({ preventScroll: true });
        }
      } else target = next;
    };

    function down(event: PointerEvent) {
      if (single || !event.isPrimary || event.button !== 0) return;
      target = null;
      focused = false;
      suppressClick = false;
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        time: event.timeStamp,
        velocity: 0,
        active: false,
      };
    }
    function move(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.active) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
          drag = null;
          return;
        }
        if (Math.abs(dx) < 6) return;
        drag.active = true;
        element!.setPointerCapture(event.pointerId);
        element!.dataset.dragging = "true";
      }
      const elapsed = Math.max(1, event.timeStamp - drag.time);
      const delta = event.clientX - drag.x;
      drag.velocity =
        drag.velocity * 0.25 +
        Math.max(-2200, Math.min(2200, (delta / elapsed) * 1000)) * 0.75;
      state.position += delta;
      drag.x = event.clientX;
      drag.time = event.timeStamp;
      render();
    }
    function release(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      suppressClick = drag.active;
      state.velocity =
        event.type === "pointercancel" || event.timeStamp - drag.time > 100
          ? 0
          : drag.velocity;
      drag = null;
      delete element!.dataset.dragging;
      if (element!.hasPointerCapture(event.pointerId))
        element!.releasePointerCapture(event.pointerId);
    }
    function click(event: MouseEvent) {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      }
    }
    function focusIn(event: FocusEvent) {
      // Center a card before holding it still for keyboard users.
      if (!(event.target instanceof Element)) return;
      if (!event.target.matches(":focus-visible")) return;
      focused = true;
      const card = event.target.closest<HTMLElement>(".orbit-card");
      const index = cards.indexOf(card!);
      if (index >= 0 && step) {
        state.position -= wrapCarousel(
          index * step + state.position,
          cards.length * step,
        );
        target = null;
        render();
      }
    }
    function focusOut(event: FocusEvent) {
      if (!element!.contains(event.relatedTarget as Node | null)) {
        focused = false;
        state.velocity = -28;
      }
    }
    function preventDrag(event: DragEvent) {
      event.preventDefault();
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        focused = true;
        navigate.current(event.key === "ArrowRight" ? 1 : -1);
      }
    }
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    element.addEventListener("lostpointercapture", release);
    element.addEventListener("click", click, true);
    element.addEventListener("focusin", focusIn);
    element.addEventListener("focusout", focusOut);
    element.addEventListener("dragstart", preventDrag);
    element.addEventListener("keydown", keydown);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      element.removeEventListener("lostpointercapture", release);
      element.removeEventListener("click", click, true);
      element.removeEventListener("focusin", focusIn);
      element.removeEventListener("focusout", focusOut);
      element.removeEventListener("dragstart", preventDrag);
      element.removeEventListener("keydown", keydown);
    };
  }, [projects, reduced]);

  return (
    <div
      className="project-orbit"
      role="region"
      aria-roledescription="carousel"
      aria-label="Project showcase"
    >
      <div
        className="orbit-stage"
        ref={stage}
        aria-label="Drag projects horizontally, or use the arrow keys"
      >
        {slots.map((project, index) => (
          <article
            className="orbit-card"
            key={`${project.id}-${index}`}
            aria-roledescription="slide"
            aria-label={`${(index % projects.length) + 1} of ${projects.length}`}
          >
            <Link
              href={`/projects/${project.slug}`}
              draggable={false}
              className="orbit-link"
              tabIndex={index === 0 ? 0 : -1}
              prefetch={false}
            >
              <div className="orbit-artwork">
                {project.coverId ? (
                  <Image
                    src={`/media/${project.coverId}`}
                    alt={`${project.title} project cover`}
                    fill
                    unoptimized
                    sizes="(max-width: 760px) 72vw, 360px"
                    draggable={false}
                  />
                ) : (
                  <div className="orbit-placeholder" aria-hidden="true">
                    <span className="orbit-blueprint" />
                    <span className="orbit-monogram">
                      {project.title
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join("")}
                    </span>
                    <span className="orbit-placeholder-title">
                      {project.title}
                    </span>
                    <span className="mono">
                      {project.stack.slice(0, 3).join(" / ")}
                    </span>
                  </div>
                )}
                <span className="orbit-open">
                  <ArrowUpRight size={20} />
                </span>
              </div>
              <div className="orbit-caption">
                <h3>{project.title}</h3>
                <span>{project.role}</span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
