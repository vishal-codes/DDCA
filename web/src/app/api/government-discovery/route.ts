import { getGovernmentDiscovery, startGovernmentDiscovery } from "@/lib/government/jobs";
import { validateWildfirePoint } from "@/lib/data/wildfire";

export const runtime = "nodejs";
export const maxDuration = 90;

const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let point;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") throw new Error("Invalid point.");
    const { latitude, longitude } = body as Record<string, unknown>;
    point = validateWildfirePoint(latitude, longitude);
  } catch {
    return Response.json({ error: "Select a valid map point." }, { status: 400, headers });
  }
  try {
    return Response.json(await startGovernmentDiscovery(point), { headers });
  } catch {
    return Response.json({ error: "Government-source collection is unavailable." }, { status: 503, headers });
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[a-f0-9]{64}$/.test(id)) {
    return Response.json({ error: "Invalid collection identifier." }, { status: 400, headers });
  }
  try {
    const job = await getGovernmentDiscovery(id);
    return job ? Response.json(job, { headers })
      : Response.json({ error: "Collection not found." }, { status: 404, headers });
  } catch {
    return Response.json({ error: "Collection status is unavailable." }, { status: 503, headers });
  }
}
