export async function reverseGeocode(lat: number, lng: number) {
  try {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    const response = await fetch(`/api/places/reverse?${params}`);
    if (!response.ok) return undefined;
    const result = (await response.json()) as { name?: string | null };
    return result.name || undefined;
  } catch {
    return undefined;
  }
}
