import { searchPlaces } from "@/lib/data/places-server";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length > 200) {
    return Response.json({ error: "Enter a location name with up to 200 characters." }, { status: 400 });
  }
  try {
    return Response.json(await searchPlaces(query));
  } catch {
    return Response.json({ error: "Location search is unavailable." }, { status: 503 });
  }
}
