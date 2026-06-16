import { NextRequest, NextResponse } from "next/server";

type NominatimReverseResult = {
  display_name?: string;
  name?: string;
  address?: {
    amenity?: string;
    building?: string;
    tourism?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    state?: string;
  };
};

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ name: null }, { status: 400 });
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    zoom: "18",
    addressdetails: "1",
    "accept-language": "en",
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    {
      headers: {
        "User-Agent": `Sonder reverse geocoding (${process.env.NOMINATIM_CONTACT_EMAIL ?? "contact-not-configured"})`,
      },
      next: { revalidate: 86400 },
    },
  );
  if (!response.ok) return NextResponse.json({ name: null }, { status: 502 });

  const result = (await response.json()) as NominatimReverseResult;
  const address = result.address;
  const name =
    result.name ||
    address?.amenity ||
    address?.building ||
    address?.tourism ||
    address?.road ||
    address?.neighbourhood ||
    address?.suburb ||
    address?.city ||
    address?.municipality ||
    result.display_name?.split(",")[0]?.trim() ||
    null;

  return NextResponse.json({ name });
}
