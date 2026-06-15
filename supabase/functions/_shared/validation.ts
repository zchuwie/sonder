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

export function optionalUuid(value: unknown, field: string): string | null {
  const text = optionalString(value, field, 36);
  if (
    text &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      text,
    )
  ) {
    throw new Error(`${field} is invalid`);
  }
  return text;
}

export function requiredUuid(value: unknown, field: string): string {
  const text = requiredString(value, field, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      text,
    )
  ) {
    throw new Error(`${field} is invalid`);
  }
  return text;
}
