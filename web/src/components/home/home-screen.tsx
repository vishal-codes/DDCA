"use client";

import { getRegions, getRegion } from "@/lib/data/regions";
import { MapPanel } from "@/components/map/map-panel";
import { useAppShell } from "@/components/shell/app-shell";
import { RegionSearch } from "@/components/shell/region-search";
import { RegionCard } from "./region-card";
import { DataLabelsGuide } from "./data-labels-guide";

export function HomeScreen() {
  const { regionId, openCoverage } = useAppShell();
  const region = regionId ? getRegion(regionId) : null;
  return (
    <div className="workspace-grid">
      <MapPanel>
        <div className="home-search-overlay">
          <h1>Check risk, roads and supplies anywhere on Earth</h1>
          <RegionSearch key={regionId ?? "none"} large />
          {region && <button type="button" className="selected-region-card surface-card" onClick={openCoverage} aria-haspopup="dialog">
            <strong>{region.name}, {region.location}</strong>
            <span className="caption">View sample data coverage</span>
          </button>}
        </div>
      </MapPanel>
      <aside className="home-sidebar" aria-labelledby="examples-title">
        <h2 id="examples-title">Try an example</h2>
        <div className="region-list">{getRegions().map((item) => <RegionCard key={item.id} region={item} />)}</div>
        <DataLabelsGuide />
      </aside>
    </div>
  );
}
