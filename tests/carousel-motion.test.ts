import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceCarousel,
  carouselScale,
  wrapCarousel,
} from "../src/lib/carousel-motion";

test("a fast flick in either direction settles back to the leftward flow", () => {
  for (const initial of [-1800, 1800]) {
    let state = { position: 0, velocity: initial };
    for (let frame = 0; frame < 600; frame++) {
      state = advanceCarousel(state.position, state.velocity, 1 / 60);
    }
    assert.ok(Math.abs(state.velocity + 28) < 0.001);
  }
});

test("momentum travels the same distance at different refresh rates", () => {
  const simulate = (hz: number) => {
    let state = { position: 0, velocity: -1500 };
    for (let frame = 0; frame < hz * 3; frame++) {
      state = advanceCarousel(state.position, state.velocity, 1 / hz);
    }
    return state;
  };
  assert.ok(Math.abs(simulate(60).position - simulate(144).position) < 0.00001);
});

test("the center is largest and looping preserves positions across many revolutions", () => {
  assert.equal(carouselScale(0, 300), 1);
  assert.ok(carouselScale(300, 300) < 1);
  assert.ok(carouselScale(600, 300) < carouselScale(300, 300));
  assert.equal(carouselScale(-300, 300), carouselScale(300, 300));
  for (const position of [-30000, -600, 0, 599, 30000]) {
    assert.ok(wrapCarousel(position, 1200) >= -600);
    assert.ok(wrapCarousel(position, 1200) < 600);
    assert.equal(
      wrapCarousel(position, 1200),
      wrapCarousel(position + 1200 * 50, 1200),
    );
  }
});
