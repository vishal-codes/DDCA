"use client";

import type { Region } from "@/types/region";
import { useAppShell } from "@/components/shell/app-shell";

export function RegionCard({ region }: { region: Region }) {
  const { regionId, selectRegion } = useAppShell();
  return (
    <button type="button" className={`surface-card region-card${regionId === region.id ? " is-selected" : ""}`}
      onClick={() => selectRegion(region.id)} aria-label={`Open ${region.name} sample ECHO overview`}>
      <strong>{region.name}</strong>
      <span className="caption">{region.description}</span>
      <span className="chip-group">{region.previewKinds.map((kind) => <span className="chip neutral-chip" key={kind}>{kind}</span>)}</span>
    </button>
  );
}
