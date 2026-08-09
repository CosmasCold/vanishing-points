export const WORLD_SIZE = 4096;

/**
 * Projects geographical coordinates (longitude, latitude) into the 4096x4096 Web Mercator coordinate system.
 * Longitude: [-180, 180] -> [0, 4096]
 * Latitude: Clamped to Web Mercator limits [-85.05112878, 85.05112878] -> [0, 4096] (0 is North Pole/Top)
 */
export function project(longitude: number, latitude: number): { x: number; y: number } {
  const lat = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const x = (longitude + 180) / 360;
  const latRad = (lat * Math.PI) / 180;
  const y = (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2;
  return {
    x: x * WORLD_SIZE,
    y: y * WORLD_SIZE,
  };
}

/**
 * Unprojects Web Mercator pixel coordinates back into geographical coordinates.
 * x: [0, 4096] -> longitude [-180, 180]
 * y: [0, 4096] -> latitude [-85.05112878, 85.05112878] (0 is North Pole/Top)
 */
export function unproject(x: number, y: number): { longitude: number; latitude: number } {
  const normX = x / WORLD_SIZE;
  const normY = y / WORLD_SIZE;
  const longitude = normX * 360 - 180;
  const latRad = 2 * Math.atan(Math.exp((1 - 2 * normY) * Math.PI)) - Math.PI / 2;
  const latitude = (latRad * 180) / Math.PI;
  return { longitude, latitude };
}
