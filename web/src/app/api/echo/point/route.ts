import { checkEchoPoint } from "@/lib/data/echo-point-server";
import { validateWildfirePoint } from "@/lib/data/wildfire";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const latitude = query.get("latitude");
  const longitude = query.get("longitude");
  let point;
  try {
    point = validateWildfirePoint(latitude?.trim() ? Number(latitude) : NaN, longitude?.trim() ? Number(longitude) : NaN);
  } catch {
    return Response.json({ error: "Enter a valid latitude and longitude." }, { status: 400 });
  }
  const result = await checkEchoPoint(point, request.signal);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
