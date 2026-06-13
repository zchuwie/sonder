export function requiredString(
  value: unknown,
  field: string,
  max: number,
): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${field} is required`);
  if (value.trim().length > max) throw new Error(`${field} is too long`);
  return value.trim();
}

export function optionalString(
  value: unknown,
  field: string,
  max: number,
): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > max)
    throw new Error(`${field} is invalid`);
  return value.trim();
}

export function coordinate(value: unknown, field: "lat" | "lng"): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`${field} is invalid`);
  const limit = field === "lat" ? 90 : 180;
  if (value < -limit || value > limit)
    throw new Error(`${field} is out of range`);
  return value;
}

export function groupKey(lat: number, lng: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}
