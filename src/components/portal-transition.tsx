"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type PortalOrigin = { x: number; y: number };

/** Reveal the real Home through an expanding, rotating star portal. */
export function PortalTransition({
  origin,
  onComplete,
}: {
  origin: PortalOrigin;
  onComplete: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    const welcome = document.querySelector<HTMLElement>(".welcome-landing");
    const destination = document.querySelector<HTMLElement>(
      ".gateway-destination",
    );
    if (!canvas || !context || !welcome) {
      onComplete();
      return;
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      onComplete();
      return;
    }

    const stars = Array.from({ length: 190 }, (_, i) => ({
      angle: i * 2.3999632297,
      distance: 0.12 + ((i * 0.754877666) % 1) * 0.88,
      size: 0.65 + (i % 5) * 0.26,
      hue: [188, 204, 230, 265][i % 4],
    }));
    let width = 0;
    let height = 0;
    let extent = 0;
    let frame = 0;
    let done = false;
    const started = performance.now();
    const duration = 1950;
    // One timeline for portal and Home: do not replay Home after it is revealed.
    function entranceAnimations() {
      // Read live animations: hydration and section observers may replace them.
      return (
        destination?.querySelector("#home")?.getAnimations({ subtree: true }) ||
        []
      ).filter(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.animationName.startsWith("intro-"),
      );
    }
    const center = { ...origin };
    const initialWidth = window.innerWidth;
    const initialHeight = window.innerHeight;
    const previousInert = [
      document.querySelector<HTMLElement>(".public-header"),
      document.querySelector<HTMLElement>("body > .footer"),
    ].map((element) => ({ element, inert: element?.inert }));
    previousInert.forEach(({ element }) => {
      if (element) element.inert = true;
    });

    function finish() {
      if (done) return;
      done = true;
      onComplete();
    }

    function resize() {
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      center.x = (origin.x * width) / initialWidth;
      center.y = (origin.y * height) / initialHeight;
      extent =
        Math.hypot(
          Math.max(center.x, width - center.x),
          Math.max(center.y, height - center.y),
        ) + 80;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      if (done) return;
      const progress = Math.min(1, (now - started) / duration);
      const opening = Math.max(0, Math.min(1, (progress - 0.22) / 0.65));
      const eased = opening * opening * (3 - 2 * opening);
      const radius = eased * extent;
      const spin = progress * 5 + progress * progress * 8;
      const alpha = 1 - Math.max(0, (progress - 0.77) / 0.23);
      const light = document.documentElement.dataset.theme === "light";
      const arrival = Math.max(0, Math.min(1, (now - started - 600) / 1050));
      const settled = 1 - (1 - arrival) ** 3;
      destination?.style.setProperty(
        "--arrival-scale",
        String(0.965 + settled * 0.035),
      );
      destination?.style.setProperty(
        "--arrival-blur",
        `${(1 - settled) * 5}px`,
      );
      destination?.style.setProperty(
        "--arrival-opacity",
        String(0.25 + settled * 0.75),
      );
      for (const animation of entranceAnimations()) {
        animation.pause();
        animation.currentTime = Math.max(0, now - started - 600);
      }
      context!.clearRect(0, 0, width, height);

      // Cut a real hole in the landing, not a screenshot of the destination.
      const mask = `radial-gradient(circle at ${center.x}px ${center.y}px, transparent ${Math.max(0, radius - 2)}px, black ${radius + 2}px)`;
      welcome!.style.maskImage = mask;
      welcome!.style.webkitMaskImage = mask;

      const orbit =
        32 + Math.sin(Math.min(progress / 0.22, 1) * Math.PI) * 27 + radius;
      const glowRadius = Math.max(70, orbit + 100);
      const glow = context!.createRadialGradient(
        center.x,
        center.y,
        Math.max(0, orbit - 24),
        center.x,
        center.y,
        glowRadius,
      );
      glow.addColorStop(0, `rgba(151, 211, 224, ${alpha * 0.16})`);
      glow.addColorStop(0.45, `rgba(170, 153, 230, ${alpha * 0.08})`);
      glow.addColorStop(1, "rgba(151, 211, 224, 0)");
      context!.fillStyle = glow;
      context!.fillRect(0, 0, width, height);

      for (let ring = 0; ring < 3; ring++) {
        context!.save();
        context!.translate(center.x, center.y);
        context!.rotate(spin * (ring % 2 ? -0.65 : 1) + ring * 1.05);
        context!.strokeStyle = `rgba(${light ? "42,104,124" : "151,211,224"},${alpha * (0.4 - ring * 0.08)})`;
        context!.lineWidth = 1 + opening * 1.5;
        context!.beginPath();
        context!.ellipse(
          0,
          0,
          orbit + ring * 16,
          (orbit + ring * 16) * (0.66 + ring * 0.12),
          0,
          0,
          Math.PI * 2,
        );
        context!.stroke();
        context!.restore();
      }

      for (const star of stars) {
        const angle = star.angle + spin * (0.45 + star.distance * 0.5);
        const distance =
          star.distance * (44 + radius * 1.5) +
          opening * opening * extent * 0.5;
        const x = center.x + Math.cos(angle) * distance;
        const y = center.y + Math.sin(angle) * distance;
        const tail = Math.min(distance * 0.25, 3 + opening * opening * 110);
        context!.strokeStyle = `hsla(${star.hue},${light ? 45 : 70}%,${light ? 40 : 82}%,${alpha * (0.35 + star.distance * 0.6)})`;
        context!.lineWidth = star.size * (1 + opening * 0.5);
        context!.lineCap = "round";
        context!.beginPath();
        context!.moveTo(x, y);
        context!.lineTo(
          x - Math.cos(angle - 0.12) * tail,
          y - Math.sin(angle - 0.12) * tail,
        );
        context!.stroke();
      }
      if (progress >= 1) finish();
      else frame = requestAnimationFrame(draw);
    }

    const fallback = setTimeout(finish, duration + 400);
    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    reduced.addEventListener("change", finish);
    return () => {
      done = true;
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
      window.removeEventListener("resize", resize);
      reduced.removeEventListener("change", finish);
      previousInert.forEach(({ element, inert }) => {
        if (element) element.inert = inert || false;
      });
      welcome.style.removeProperty("mask-image");
      welcome.style.removeProperty("-webkit-mask-image");
      for (const animation of entranceAnimations()) {
        animation.finish();
      }
      for (const property of [
        "--arrival-scale",
        "--arrival-blur",
        "--arrival-opacity",
      ])
        destination?.style.removeProperty(property);
    };
  }, [origin, onComplete]);

  return createPortal(
    <div className="portal-transition" aria-hidden="true">
      <canvas ref={ref} />
    </div>,
    document.body,
  );
}
