import { EchoPointScreen } from "@/components/echo/echo-point-screen";
import { validateWildfirePoint } from "@/lib/data/wildfire";
import { HomeScreen } from "@/components/home/home-screen";
import Link from "next/link";

type Params = { latitude?: string; longitude?: string };
export default async function GlobalEchoPage({ searchParams }: { searchParams: Promise<Params> }) {
  const query = await searchParams;
  if (query.latitude === undefined && query.longitude === undefined) return <HomeScreen />;
  let point;
  try {
    if (typeof query.latitude !== "string" || !query.latitude.trim() ||
        typeof query.longitude !== "string" || !query.longitude.trim()) throw new Error("Missing coordinates.");
    point = validateWildfirePoint(Number(query.latitude), Number(query.longitude));
  } catch {
    return <div className="surface-card methods-page"><h1>Choose a valid location</h1>
      <p>The coordinates in this link are invalid.</p><Link className="text-link" href="/">Return to the world map</Link>
    </div>;
  }
  return <EchoPointScreen key={`${point.latitude},${point.longitude}`} initialPoint={point} />;
}
