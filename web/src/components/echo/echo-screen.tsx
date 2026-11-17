import type { RegionId } from "@/types/region";
import { REGION_CAMERAS } from "@/lib/map/cameras";
import { EchoPointScreen } from "./echo-point-screen";

export function EchoScreen({ regionId }: { regionId: RegionId }) {
  return <EchoPointScreen initialPoint={REGION_CAMERAS[regionId]} />;
}
