const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function geocodeAddress(
  query: string
): Promise<
  Array<{
    place_name: string;
    center: [number, number];
    context: Array<{ text: string }>;
  }>
> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?access_token=${MAPBOX_TOKEN}&limit=5`;

  const res = await fetch(url);
  const data = await res.json();
  return data.features || [];
}

export async function reverseGeocode(
  lng: number,
  lat: number
): Promise<string> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=place,country&limit=1`;

  const res = await fetch(url);
  const data = await res.json();
  return data.features?.[0]?.place_name || "Unknown location";
}