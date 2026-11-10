"use client";

import { useState } from "react";
import { getTripSamples, getSampleTime } from "@/lib/data/workspace";
import { getRegion } from "@/lib/data/regions";
import { googleMapsLink } from "@/lib/google-maps-link";
import { initialLayers } from "@/lib/layers";
import type { RegionId } from "@/types/region";
import type { PanelTab } from "@/types/workspace";
import { RegionalMap } from "@/components/map/regional-map";
import { MapLegend } from "@/components/map/map-legend";
import { RightPanel } from "@/components/panels/right-panel";
import { SampleCitation } from "@/components/shared/sample-citation";
import { useAppShell } from "@/components/shell/app-shell";
import { TripForm, type TripDraft } from "./trip-form";
import { HazardList } from "./hazard-list";

export function NetScreen({ regionId }: { regionId: RegionId }) {
  const samples = getTripSamples(regionId);
  const initial: TripDraft = { origin: samples.stops[0]?.address ?? "", destination: samples.stops[2]?.address ?? "", depot: samples.stops[1]?.address ?? "", viaDepot: samples.stops.length > 0, delivery: "Medical supplies", vehicle: "Emergency transport vehicle", priority: "Urgent" };
  const [draft, setDraft] = useState(initial);
  const [trip, setTrip] = useState(initial);
  const [tab, setTab] = useState<PanelTab>("Analysis");
  const [layers, setLayers] = useState(() => initialLayers(regionId));
  const [notice, setNotice] = useState("");
  const { previewState } = useAppShell();
  const stale = previewState === "stale" || previewState === "offline";
  const backup = samples.stops[3];
  const usingBackup = backup && trip.depot === backup.address;
  const depotPoint = usingBackup ? "54,27" : "69,36";
  const points = trip.viaDepot ? `43,52 ${depotPoint} 87,16` : "43,52 87,16";
  const href = googleMapsLink(trip.origin, trip.destination, trip.viaDepot ? [trip.depot] : []);
  const stops = [{ name: "Start", address: trip.origin }, ...(trip.viaDepot ? [{ name: "Depot", address: trip.depot }] : []), { name: "Destination", address: trip.destination }];
  return <div className="workspace-grid">
    <RegionalMap onLayers={() => setTab("Layers")} showLegend={false}>
      <h1 className="sr-only">NET - {getRegion(regionId).name}</h1>
      <div className="trip-form-position"><TripForm draft={draft} onChange={setDraft} onSubmit={() => { setTrip({ ...draft }); setNotice("Sample trip brief updated."); }} /></div>
      <div className="regional-scene trip-scene">
        {layers.hazardMaps.enabled && samples.hazards.length > 0 && <span className="trip-hazard-area" style={{ opacity: layers.hazardMaps.opacity / 100 }} aria-label="Sample official hazard zone" />}
        {layers.roadClosures.enabled && samples.hazards.length > 0 && <span className="sample-closure" aria-label="Sample road closure">-</span>}
        {layers.evacuationZones.enabled && samples.hazards.length > 0 && <span className="sample-evacuation" aria-label="Sample evacuation boundary" />}
        {layers.alerts.enabled && samples.hazards.length > 0 && <span className="sample-map-alert" aria-label="Sample alert location">!</span>}
        {trip.origin && trip.destination && <>
          <svg className="stop-connector" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" /></svg>
          <span className="stop-marker" style={{ left: "43%", top: "52%" }}>S<span>Start</span></span>
          {trip.viaDepot && <span className="stop-marker depot-marker" style={{ left: usingBackup ? "54%" : "69%", top: usingBackup ? "27%" : "36%" }}>D<span>Depot</span></span>}
          <span className="stop-marker destination-marker" style={{ left: "87%", top: "16%" }}>+<span>Destination</span></span>
        </>}
      </div>
      <div className="surface-card connector-label"><strong>Straight line, not a route</strong><p className="caption">Sample stop positions are schematic.</p></div>
      <section className="surface-card trip-stops-card"><h2>Trip stops</h2>
        <a className="primary-button maps-handoff" href={href ?? undefined} aria-disabled={!href} tabIndex={href ? 0 : -1} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
        <dl>{stops.map((stop) => <div key={stop.name}><dt>{stop.name}</dt><dd>{stop.address || "Enter an address"}</dd></div>)}</dl>
        <p className="caption">{trip.delivery}. {trip.vehicle}. {trip.priority}.</p>
        <p role="status" className="caption">{notice || "Sample data. Stop selection is a fixed example; no route is calculated."}</p>
        {!href && <p className="caption">Enter shorter, complete stop addresses and update the brief to open Maps.</p>}
        <p className="caption">Google Maps chooses roads separately. Check closures and official orders before travel.</p>
      </section>
    </RegionalMap>
    <RightPanel tab={tab} onTab={setTab} regionId={regionId} layers={layers} onLayerChange={(kind, patch) => setLayers((value) => ({ ...value, [kind]: { ...value[kind], ...patch } }))}>
      <section className="surface-card backup-card"><h2>Backup depot</h2>{backup ? <>
        <strong>{usingBackup ? samples.stops[1].name : backup.name}</strong><p className="caption">Sample option. Access and opening status are unconfirmed.</p>
        <button type="button" className="text-link" onClick={() => {
          const depot = usingBackup ? samples.stops[1].address : backup.address;
          setDraft((value) => ({ ...value, depot, viaDepot: true })); setTrip((value) => ({ ...value, depot, viaDepot: true })); setNotice("Sample depot stop changed.");
        }}>{usingBackup ? "Use Depot Central" : "Use backup depot"}</button>
      </> : <p className="missing-value">Not enough data</p>}
        <SampleCitation sourceName="Design reference (sample depot)" updatedAt={getSampleTime()} />
      </section>
      <MapLegend />
      <HazardList hazards={samples.hazards} stale={stale} />
    </RightPanel>
  </div>;
}
