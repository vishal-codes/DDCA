import { notFound } from "next/navigation";
import { isRegionId, isWorkspaceMode } from "@/lib/workspace";
import { getRegions } from "@/lib/data/regions";
import { EchoScreen } from "@/components/echo/echo-screen";
import { NetScreen } from "@/components/net/net-screen";
import { SeraScreen } from "@/components/sera/sera-screen";

export function generateStaticParams() {
  return getRegions().flatMap((region) => ["echo", "net", "sera"].map((mode) => ({ region: region.id, mode })));
}
export default async function WorkspacePage({ params }: { params: Promise<{ region: string; mode: string }> }) {
  const { region, mode } = await params;
  if (!isRegionId(region) || !isWorkspaceMode(mode)) notFound();
  if (mode === "echo") return <EchoScreen key={region} regionId={region} />;
  if (mode === "net") return <NetScreen key={region} regionId={region} />;
  return <SeraScreen key={region} regionId={region} />;
}
