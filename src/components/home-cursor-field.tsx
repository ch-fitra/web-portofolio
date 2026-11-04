"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

type Particle = {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  phase: number;
};
type Trace = { x: number; y: number; born: number };
type Spark = Trace & { vx: number; vy: number; hue: number };

/** A decorative canvas: pointer events always pass through to the page. */
export function HomeCursorField({
  surface = ".home-page",
}: {
  surface?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    const canvas = ref.current;
    const home = document.querySelector<HTMLElement>(surface);
    const ctx = canvas?.getContext("2d");
    if (!canvas || !home || !ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(any-hover: hover) and (any-pointer: fine)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let accumulator = 0;
    let visible = false;
    let particles: Particle[] = [];
    const trail: Trace[] = [];
    const ripples: Trace[] = [];
    const sparks: Spark[] = [];
    const pointer = { x: -1000, y: -1000, active: false, held: false };
    const follower = { x: -1000, y: -1000 };
    const enabled = () => !reduced.matches && fine.matches;

    function clear() {
      ctx!.clearRect(0, 0, width, height);
      trail.length = 0;
      ripples.length = 0;
      sparks.length = 0;
      pointer.active = false;
      pointer.held = false;
    }

    function resize() {
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      // Cap resolution and particle count for large / high-DPI monitors.
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(150, Math.floor((width * height) / 8000));
      particles = Array.from({ length: count }, (_, i) => {
        // Stable distribution, so resizing does not visibly reshuffle the field.
        const x = (((i * 0.61803398875 + 0.13) % 1) * 0.96 + 0.02) * width;
        const y = (((i * 0.754877666 + 0.27) % 1) * 0.94 + 0.03) * height;
        return { x, y, homeX: x, homeY: y, vx: 0, vy: 0, phase: i * 2.4 };
      });
      clear();
    }

    function draw(now: number) {
      frame = 0;
      if (!enabled() || !visible || document.hidden) return;
      const elapsed = Math.min(now - (previous || now - 16.67), 50);
      previous = now;
      ctx!.clearRect(0, 0, width, height);
      const light = document.documentElement.dataset.theme === "light";
      const rgb = light ? "42, 104, 124" : "151, 211, 224";

      // Sample the pointer on animation frames, rather than mouse event cadence.
      // Exponential smoothing behaves the same on 60Hz and 144Hz displays.
      const ease = 1 - Math.exp(-elapsed / 38);
      const oldX = follower.x;
      const oldY = follower.y;
      follower.x += (pointer.x - follower.x) * ease;
      follower.y += (pointer.y - follower.y) * ease;
      if (
        pointer.active &&
        Math.hypot(follower.x - oldX, follower.y - oldY) > 0.15
      ) {
        trail.push({ x: follower.x, y: follower.y, born: now });
        if (trail.length > 120) trail.shift();
      }

      // Small fixed simulation steps prevent spring judder on uneven frames.
      accumulator += elapsed;
      while (accumulator >= 1000 / 120) {
        accumulator -= 1000 / 120;
        const step = 0.5;
        for (const p of particles) {
          const dx = p.x - follower.x;
          const dy = p.y - follower.y;
          const distance = Math.hypot(dx, dy);
          const influence = pointer.active
            ? Math.max(0, 1 - distance / 210) ** 2
            : 0;
          if (influence > 0) {
            const radial = pointer.held ? -1.3 : 2.2;
            const swirl = pointer.held ? 2.8 : 0.55;
            p.vx +=
              ((dx * radial - dy * swirl) / (distance || 1)) * influence * step;
            p.vy +=
              ((dy * radial + dx * swirl) / (distance || 1)) * influence * step;
          }
          for (const ripple of ripples) {
            const dx = p.x - ripple.x;
            const dy = p.y - ripple.y;
            const distance = Math.hypot(dx, dy);
            const age = (now - ripple.born) / 1100;
            const radius = 12 + (1 - (1 - Math.min(age, 1)) ** 3) * 240;
            const force =
              Math.max(0, 1 - Math.abs(distance - radius) / 45) * (1 - age);
            p.vx += (dx / (distance || 1)) * force * 1.4 * step;
            p.vy += (dy / (distance || 1)) * force * 1.4 * step;
          }
          const driftX = Math.sin(now * 0.0003 + p.phase) * 6;
          const driftY = Math.cos(now * 0.00025 + p.phase) * 6;
          p.vx += (p.homeX + driftX - p.x) * 0.009 * step;
          p.vy += (p.homeY + driftY - p.y) * 0.009 * step;
          p.vx *= Math.pow(0.91, step);
          p.vy *= Math.pow(0.91, step);
          p.x += p.vx * step;
          p.y += p.vy * step;
        }
        for (const spark of sparks) {
          spark.x += spark.vx * step;
          spark.y += spark.vy * step;
          spark.vx *= 0.985;
          spark.vy *= 0.985;
        }
      }

      for (const p of particles) {
        const distance = Math.hypot(p.x - follower.x, p.y - follower.y);
        const influence = pointer.active ? Math.max(0, 1 - distance / 210) : 0;
        ctx!.strokeStyle = `rgba(${rgb},${0.2 + influence * 0.55})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(p.x - 1.5, p.y);
        ctx!.lineTo(p.x + 1.5 + Math.min(Math.abs(p.vx), 3), p.y + p.vy * 0.5);
        ctx!.stroke();
        if (influence > 0.35 && distance < 110) {
          ctx!.strokeStyle = `rgba(${rgb},${influence * 0.1})`;
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(follower.x, follower.y);
          ctx!.stroke();
        }
      }

      while (trail.length && now - trail[0].born > 850) trail.shift();
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      for (let i = 1; i < trail.length - 1; i++) {
        const p = trail[i];
        const last = trail[i - 1];
        const next = trail[i + 1];
        const life = Math.max(0, 1 - (now - p.born) / 850);
        ctx!.strokeStyle = light
          ? `rgba(83, 99, 168,${life * 0.5})`
          : `rgba(${Math.round(155 + (1 - life) * 45)}, ${Math.round(150 + life * 65)}, 238, ${life * 0.75})`;
        ctx!.lineWidth = 0.3 + life * 2.2;
        ctx!.beginPath();
        ctx!.moveTo((last.x + p.x) / 2, (last.y + p.y) / 2);
        ctx!.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
        ctx!.stroke();
      }

      // Small, local glow gives the ribbon a soft head without covering content.
      if (pointer.active) {
        const glow = ctx!.createRadialGradient(
          follower.x,
          follower.y,
          0,
          follower.x,
          follower.y,
          32,
        );
        glow.addColorStop(0, `rgba(${rgb},0.12)`);
        glow.addColorStop(1, `rgba(${rgb},0)`);
        ctx!.fillStyle = glow;
        ctx!.fillRect(follower.x - 32, follower.y - 32, 64, 64);
      }

      while (sparks.length && now - sparks[0].born > 1000) sparks.shift();
      for (const spark of sparks) {
        const life = Math.max(0, 1 - (now - spark.born) / 1000);
        ctx!.fillStyle = `hsla(${spark.hue},${light ? 45 : 75}%,${light ? 40 : 78}%,${life * 0.8})`;
        ctx!.beginPath();
        ctx!.arc(spark.x, spark.y, 0.4 + life * 1.6, 0, Math.PI * 2);
        ctx!.fill();
      }

      while (ripples.length && now - ripples[0].born > 1100) ripples.shift();
      for (const ripple of ripples) {
        const age = (now - ripple.born) / 1100;
        ctx!.strokeStyle = `rgba(${rgb},${(1 - age) ** 2 * 0.38})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.arc(
          ripple.x,
          ripple.y,
          12 + (1 - (1 - age) ** 3) * 240,
          0,
          Math.PI * 2,
        );
        ctx!.stroke();
      }
      frame = requestAnimationFrame(draw);
    }

    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      accumulator = 0;
      canvas!.hidden = !enabled() || !visible;
      if (enabled() && visible && !document.hidden) {
        frame = requestAnimationFrame(draw);
      } else {
        clear();
      }
    }

    function move(event: PointerEvent) {
      if (!enabled() || !visible || event.pointerType === "touch") return;
      const x = event.clientX;
      const y = event.clientY;
      const inside = x >= 0 && x <= width && y >= 0 && y <= height;
      if (inside && !pointer.active) {
        follower.x = x;
        follower.y = y;
        trail.length = 0;
      }
      pointer.active = inside;
      pointer.x = x;
      pointer.y = y;
      if (!inside) pointer.held = false;
    }

    function leave() {
      pointer.active = false;
      pointer.held = false;
    }

    function click(event: PointerEvent) {
      move(event);
      if (!enabled() || !pointer.active || event.pointerType === "touch")
        return;
      ripples.push({ x: pointer.x, y: pointer.y, born: performance.now() });
      if (ripples.length > 4) ripples.shift();
      // Hold in empty space to gather a vortex; links/buttons retain native behavior.
      pointer.held =
        event.button === 0 &&
        !(
          event.target instanceof Element &&
          event.target.closest("a, button, input, textarea, select")
        );
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const speed = 1.8 + (i % 4) * 0.7;
        sparks.push({
          x: pointer.x,
          y: pointer.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          born: performance.now(),
          hue: 185 + (i % 5) * 18,
        });
      }
      if (sparks.length > 100) sparks.splice(0, sparks.length - 100);
    }

    function release() {
      pointer.held = false;
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    resize();
    observer.observe(home);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", leave);
    window.addEventListener("pointerout", out);
    window.addEventListener("blur", leave);
    window.addEventListener("scroll", leave, { passive: true });
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    fine.addEventListener("change", sync);
    function out(event: PointerEvent) {
      if (!event.relatedTarget) leave();
    }
    sync();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", leave);
      window.removeEventListener("pointerout", out);
      window.removeEventListener("blur", leave);
      window.removeEventListener("scroll", leave);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      fine.removeEventListener("change", sync);
    };
  }, [ready, surface]);

  // Escape content widths, overflow clipping, and transformed entrance wrappers.
  return ready
    ? createPortal(
        <canvas ref={ref} className="home-cursor-field" aria-hidden="true" />,
        document.body,
      )
    : null;
}
