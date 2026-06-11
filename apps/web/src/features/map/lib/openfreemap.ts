export const OPENFREEMAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/fiord",
} as const;

export function getOpenFreeMapStyle(theme?: string): string {
  return theme === "dark" ? OPENFREEMAP_STYLES.dark : OPENFREEMAP_STYLES.light;
}
