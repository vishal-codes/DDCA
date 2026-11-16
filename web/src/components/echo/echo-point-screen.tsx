"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ECHO_START_POINT, getEchoPoint, type EchoPointResult } from "@/lib/data/echo-point";
import { validateWildfirePoint, type WildfirePoint } from "@/lib/data/wildfire";
import type { NwsAlert } from "@/lib/data/nws-alerts";
import { USGS_TOPO } from "@/lib/map/basemap";
import type { PanelTab } from "@/types/workspace";
import { EchoBasemap } from "@/components/map/echo-basemap";
import { RightPanel } from "@/components/panels/right-panel";
import { EchoFindings, NwsBanner, WildfireSource } from "./echo-point-findings";
import { NwsAlertDetail } from "./nws-alert-detail";

type Lookup = { point: WildfirePoint; result: EchoPointResult | null };

export function EchoPointScreen() {
  const [point, setPoint] = useState(ECHO_START_POINT);
  const [center, setCenter] = useState(ECHO_START_POINT);
  const [tab, setTab] = useState<PanelTab>("Analysis");
  const [lookup, setLookup] = useState<Lookup>();
  const [selectedAlert, setSelectedAlert] = useState<NwsAlert | null>(null);
  const [showWildfireZones, setShowWildfireZones] = useState(true);
  const [latitude, setLatitude] = useState(String(ECHO_START_POINT.latitude));
  const [longitude, setLongitude] = useState(String(ECHO_START_POINT.longitude));
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getEchoPoint(point, controller.signal).then(
      (result) => { if (!controller.signal.aborted) setLookup({ point, result }); },
      () => { if (!controller.signal.aborted) setLookup({ point, result: null }); },
    );
    return () => controller.abort();
  }, [point]);

  function selectPoint(value: WildfirePoint) {
    const selected = { latitude: Number(value.latitude.toFixed(5)), longitude: Number(value.longitude.toFixed(5)) };
    setInputError("");
    setPoint(selected);
    setLatitude(String(selected.latitude));
    setLongitude(String(selected.longitude));
    setTab("Analysis");
  }

  function submitPoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const selected = validateWildfirePoint(latitude.trim() ? Number(latitude) : NaN, longitude.trim() ? Number(longitude) : NaN);
      setCenter(selected);
      selectPoint(selected);
    } catch {
      setInputError("Enter a valid latitude and longitude in decimal degrees.");
    }
  }

  const completed = lookup?.point === point;
  const result = completed ? lookup.result : null;
  const alerts = result?.alerts;
  const firstAlert = alerts?.status === "checked" ? alerts.data[0] : undefined;

  return <div className="echo-point-screen">
    {alerts?.status === "checked" && firstAlert && <NwsBanner alert={firstAlert} checkedAt={alerts.checkedAt} onAlert={() => setSelectedAlert(firstAlert)} />}
    <div className="workspace-grid">
      <EchoBasemap center={center} point={point} showWildfireZones={showWildfireZones} onPan={setCenter} onSelect={selectPoint} onLayers={() => setTab("Layers")} />
      <RightPanel tab={tab} onTab={setTab} regionId="los-angeles"
        layersContent={<><h2>Map layers</h2><p>{USGS_TOPO.name} basemap and selected point.</p>
          <label className="checkbox-label">
            <input type="checkbox" checked={showWildfireZones} onChange={(event) => setShowWildfireZones(event.target.checked)} />
            CAL FIRE wildfire hazard zones
          </label>
          <p className="caption">Map boundaries are simplified. Analysis checks the selected point against the published layer.</p>
        </>}
        evidenceContent={<><h2>Sources and dates</h2><WildfireSource checkedAt={result?.wildfire.status === "checked" ? result.wildfire.checkedAt : undefined} /><p className="evidence-entry">Active weather alerts are checked with the National Weather Service. The Analysis tab shows the result for the selected point.</p></>}
        notesIntro="Official alerts and orders take priority. Notes apply to this visit.">
        <h2>Point analysis</h2>
        <form className="echo-point-form" onSubmit={submitPoint}>
          <div>
            <label className="field-label">Latitude<input name="latitude" type="number" min="-90" max="90" step="any" required value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label>
            <label className="field-label">Longitude<input name="longitude" type="number" min="-180" max="180" step="any" required value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label>
          </div>
          {inputError && <p role="alert">{inputError}</p>}
          <button className="primary-button" type="submit">Check point</button>
          <button className="text-link" type="button" onClick={() => selectPoint(point)}>Refresh data</button>
        </form>
        <div aria-live="polite">
          {!completed ? <p className="caption">Checking CAL FIRE and NWS for this point...</p>
            : result ? <EchoFindings result={result} onAlert={setSelectedAlert} />
            : <p className="missing-value">Not enough data. The point lookup could not be reached.</p>}
        </div>
        <p className="caption echo-point-scope">Flood, landslide and earthquake: Not enough data.</p>
      </RightPanel>
    </div>
    {selectedAlert && <NwsAlertDetail alert={selectedAlert} onClose={() => setSelectedAlert(null)} />}
  </div>;
}
