import { describe, expect, it } from "vitest";
import { advancePanoramaBlend, panoramaYaw, PANORAMA_PITCH_DEGREES } from "../lib/panorama-motion";

describe("panorama motion", () => {
  it("keeps the panorama level with zero vertical tilt", () => {
    expect(PANORAMA_PITCH_DEGREES).toBe(0);
  });
  it("rotates positively one full turn in six minutes", () => {
    expect(panoramaYaw(360)).toBeCloseTo(Math.PI * 2);
    expect(panoramaYaw(1)).toBeCloseTo(Math.PI / 180);
  });
  it("fades to night over one second without overshooting", () => {
    expect(advancePanoramaBlend(0, true, 0.5)).toBe(0.5);
    expect(advancePanoramaBlend(0.5, true, 0.5)).toBe(1);
    expect(advancePanoramaBlend(1, true, 2)).toBe(1);
  });
  it("reverses a partial fade without resetting and returns to morning", () => {
    expect(advancePanoramaBlend(0.6, false, 0.2)).toBeCloseTo(0.4);
    expect(advancePanoramaBlend(0.4, false, 1)).toBe(0);
  });
});