import type { RegionId } from "@/types/region";
import type { PreviewState, WorkspaceMode } from "@/types/workspace";

export function isRegionId(value: string): value is RegionId {
  return ["jakarta", "lisbon", "los-angeles"].includes(value);
}
export function isWorkspaceMode(value: string): value is WorkspaceMode {
  return ["echo", "net", "sera"].includes(value);
}
export function parseWorkspacePath(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [region, mode] = parts;
  return isRegionId(region) && isWorkspaceMode(mode) ? { regionId: region, mode } : null;
}
export function resolvePreviewState(raw: string | null, development: boolean): PreviewState {
  return development && ["wildfire", "stale", "offline"].includes(raw ?? "") ? raw as PreviewState : "normal";
}
export function workspaceHref(region: RegionId, mode: WorkspaceMode, state: PreviewState = "normal") {
  return `/${region}/${mode}${state === "normal" ? "" : `?state=${state}`}`;
}
