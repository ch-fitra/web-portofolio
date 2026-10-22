"use client";
import { useEffect, useRef } from "react";
// Decorative signal drawing, not a running AI model.
export function NeuralMesh() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const update = () => {
      if (ref.current) ref.current.dataset.paused = String(document.hidden);
    };
    document.addEventListener("visibilitychange", update);
    update();
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return (
    <svg
      ref={ref}
      className="neural-mesh"
      viewBox="0 0 400 500"
      fill="none"
      aria-hidden="true"
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.transform = `translate(${(e.clientX - box.x - box.width / 2) / 35}px,${(e.clientY - box.y - box.height / 2) / 35}px)`;
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = "translate(0,0)";
      }}
    >
      <g stroke="currentColor" strokeWidth=".6">
        <path d="M30 90 110 170 40 300 140 380 215 440M110 170 230 90 330 180 260 290 350 410M40 300 260 290 110 170M140 380 260 290 330 180M230 90 260 290" />
        <path className="mesh-signal" d="M30 90 110 170 260 290 350 410" />
      </g>
      {[
        [30, 90],
        [110, 170],
        [40, 300],
        [140, 380],
        [215, 440],
        [230, 90],
        [330, 180],
        [260, 290],
        [350, 410],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r={i === 7 ? 5 : 3}
            fill="var(--bg)"
            stroke="currentColor"
          />
          <circle cx={x} cy={y} r="1" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}
