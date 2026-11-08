export const PANORAMA_SECONDS_PER_TURN = 360;
export const PANORAMA_FADE_SECONDS = 1;

export function panoramaYaw(elapsedSeconds: number) {
  return (elapsedSeconds / PANORAMA_SECONDS_PER_TURN) * Math.PI * 2;
}

export function advancePanoramaBlend(current: number, night: boolean, deltaSeconds: number) {
  const step = Math.max(0, deltaSeconds) / PANORAMA_FADE_SECONDS;
  return night ? Math.min(1, current + step) : Math.max(0, current - step);
}