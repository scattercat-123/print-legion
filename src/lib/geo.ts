export const COORDINATES_REGEX =
  /^([-+]?\d{1,2}[.]\d+),\s*([-+]?\d{1,3}[.]\d+)$/;

export interface GeocodingResult {
  place_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
}

export async function geocodeSearch(query: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}`,
    {
      headers: {
        "accept-language": "en-US",
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }
  return (await response.json()) as GeocodingResult[];
}

export async function geocodeLocation(
  location: string | { lat: string; lon: string },
  fallbackName?: string
): Promise<GeocodingResult> {
  const response = await fetch(
    typeof location === "string"
      ? `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          location
        )}`
      : `https://nominatim.openstreetmap.org/reverse.php?lat=${location.lat}&lon=${location.lon}&zoom=12&format=jsonv2`,
    {
      headers: {
        "accept-language": "en-US",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }

  let item: GeocodingResult;
  if (typeof location === "string") {
    const results = (await response.json()) as GeocodingResult[];
    if (!results || results.length === 0) {
      throw new Error(`Location not found: ${location}`);
    }
    item = results[0];
  } else {
    item = (await response.json()) as GeocodingResult;
  }

  if (fallbackName && !item.name) {
    item.name = fallbackName;
  }

  return item;
}
