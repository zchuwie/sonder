export const OPENFREEMAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/liberty",
} as const;

export function getOpenFreeMapStyle(_theme?: string): string {
  return OPENFREEMAP_STYLES.light;
}
