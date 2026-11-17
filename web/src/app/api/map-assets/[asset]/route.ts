import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const runtime = "nodejs";

const allowedAssets = new Set(["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]);
// Use the native resolver so webpack cannot rewrite this installed asset lookup.
const packageRequire = process.getBuiltinModule("node:module").createRequire(resolve(process.cwd(), "package.json"));

export async function GET(_request: Request, { params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params;
  if (!allowedAssets.has(asset)) return new Response("Map asset not found.", { status: 404 });
  try {
    const path = packageRequire.resolve(`maplibre-gl/dist/${asset}`);
    const source = await readFile(path);
    return new Response(source, {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Map worker is unavailable. Reinstall the web dependencies.", { status: 503 });
  }
}
