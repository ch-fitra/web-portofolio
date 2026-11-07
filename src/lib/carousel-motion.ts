/** Exact exponential damping: release momentum settles back to the flowing speed. */
export function advanceCarousel(
  position: number,
  velocity: number,
  dt: number,
  base = -28,
) {
  const decay = Math.exp(-2.1 * dt);
  return {
    position: position + base * dt + ((velocity - base) * (1 - decay)) / 2.1,
    velocity: base + (velocity - base) * decay,
  };
}

export function wrapCarousel(value: number, span: number) {
  return ((((value + span / 2) % span) + span) % span) - span / 2;
}

export function carouselScale(distance: number, step: number) {
  return 0.58 + 0.42 * Math.exp(-0.5 * (distance / (step * 0.85)) ** 2);
}
