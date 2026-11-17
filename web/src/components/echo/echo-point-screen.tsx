"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ECHO_START_POINT, getEchoPoint, sourceApplies, type EchoPointResult } from "@/lib/data/echo-point";
import { validateWildfirePoint, type WildfirePoint } from "@/lib/data/wildfire";
import type { NwsAlert } from "@/lib/data/nws-alerts";
import type { PanelTab } from "@/types/workspace";
import { EchoBasemap } from "@/components/map/echo-basemap";
import { RightPanel } from "@/components/panels/right-panel";
import { EchoFindings, NwsBanner } from "./echo-point-findings";
import { NwsAlertDetail } from "./nws-alert-detail";
import { EchoEvidence } from "./echo-evidence";
import { EarthquakeFindings } from "./earthquake-findings";
import { useAppShell } from "@/components/shell/app-shell";
import { GovernmentDiscoveryPanel } from "@/components/government/government-discovery-panel";
import { useGovernmentDiscovery } from "@/components/government/use-government-discovery";
import { EchoLayerPanel } from "./echo-layer-panel";
import { LocalContextFindings } from "./local-context-findings";
import type { ObservedEarthquake } from "@/lib/data/earthquakes";

type Lookup = { point: WildfirePoint; refresh: number; result: EchoPointResult | null };
const noEarthquakes: readonly ObservedEarthquake[] = [];

export function EchoPointScreen({ initialPoint = ECHO_START_POINT }: { initialPoint?: WildfirePoint }) {
  const { setEchoCoverage } = useAppShell();
  const [point, setPoint] = useState(initialPoint);
  const [center, setCenter] = useState(initialPoint);
  const [tab, setTab] = useState<PanelTab>("Analysis");
  const [lookup, setLookup] = useState<Lookup>();
  const [refresh, setRefresh] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState<NwsAlert | null>(null);
  const [showWildfireZones, setShowWildfireZones] = useState(true);
  const [wildfireOpacity, setWildfireOpacity] = useState(55);
  const [latitude, setLatitude] = useState(String(initialPoint.latitude));
  const [longitude, setLongitude] = useState(String(initialPoint.longitude));
  const [inputError, setInputError] = useState("");
  const [locating, setLocating] = useState(false);
  const [mapIssue, setMapIssue] = useState<string | null>(null);
  const [mapRetry, setMapRetry] = useState(0);
  const [selectedEarthquakeId, setSelectedEarthquakeId] = useState<string | null>(null);
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [focusRevision, setFocusRevision] = useState(0);
  const collection = useGovernmentDiscovery(point);

  useEffect(() => {
    const controller = new AbortController();
    getEchoPoint(point, controller.signal).then(
      (result) => { if (!controller.signal.aborted) setLookup({ point, refresh, result }); },
      () => {
        if (controller.signal.aborted) return;
        setLookup((previous) => {
          if (!previous || previous.point.latitude !== point.latitude || previous.point.longitude !== point.longitude || !previous.result) {
            return { point, refresh, result: null };
          }
          const { wildfire, alerts, earthquake } = previous.result;
          const staleReason = "Refresh failed. Showing the last successful check.";
          return {
            point, refresh,
            result: {
              wildfire: wildfire.status === "checked" ? { ...wildfire, isStale: true, staleReason } : wildfire,
              alerts: alerts.status === "checked" ? { ...alerts, isStale: true, staleReason } : alerts,
              earthquake: earthquake?.status === "checked" ? { ...earthquake, isStale: true, staleReason } : earthquake,
            },
          };
        });
      },
    );
    return () => controller.abort();
  }, [point, refresh]);

  function selectPoint(value: WildfirePoint) {
    const selected = { latitude: Number(value.latitude.toFixed(5)), longitude: Number(value.longitude.toFixed(5)) };
    setInputError("");
    setPoint(selected);
    setLatitude(String(selected.latitude));
    setLongitude(String(selected.longitude));
    setSelectedAlert(null);
    setSelectedEarthquakeId(null);
    setTab("Analysis");
  }

  function locateDevice() {
    if (!navigator.geolocation) {
      setInputError("This browser cannot provide a location. Click the map or enter coordinates.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const selected = { latitude: coords.latitude, longitude: coords.longitude };
      selectPoint(selected);
      setCenter(selected);
      setLocating(false);
    }, () => {
      setInputError("Your location could not be read. Click the map or enter coordinates.");
      setLocating(false);
    }, { timeout: 10000, maximumAge: 60000 });
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
  const refreshing = completed && lookup.refresh !== refresh;
  const result = completed ? lookup.result : null;
  const alerts = result?.alerts;
  const firstAlert = alerts?.status === "checked" ? alerts.data[0] : undefined;
  const pending = !completed || refreshing;
  const wildfireAvailable = sourceApplies(result?.wildfire);
  const preparing = !completed || collection.searching;
  const sourceFailure = result && [result.alerts, result.wildfire, result.earthquake].some((source) =>
    source && sourceApplies(source) && (source.status === "unavailable" || source.isStale));
  const earthquakeSource = result?.earthquake;
  const earthquakes = earthquakeSource?.status === "checked" ? earthquakeSource.data.events : noEarthquakes;
  const focusPoints = useMemo(() => {
    const selected = earthquakes.find((event) => event.id === selectedEarthquakeId);
    return showEarthquakes && earthquakes.length ? selected ? [selected] : [point, ...earthquakes] : undefined;
  }, [earthquakes, point, selectedEarthquakeId, showEarthquakes]);

  function selectEarthquake(id: string | null) {
    setSelectedEarthquakeId(id);
    setShowEarthquakes(true);
    setFocusRevision((value) => value + 1);
    setTab("Analysis");
  }

  useEffect(() => {
    setEchoCoverage({ point, result, pending });
  }, [point, result, pending, setEchoCoverage]);

  useEffect(() => () => setEchoCoverage(null), [setEchoCoverage]);

  return <div className="echo-point-screen">
    <h1 className="sr-only">ECHO point analysis</h1>
    {alerts?.status === "checked" && firstAlert && <NwsBanner alert={firstAlert} checkedAt={alerts.checkedAt}
      isStale={alerts.isStale} staleReason={alerts.staleReason} onAlert={() => setSelectedAlert(firstAlert)} />}
    <div className="workspace-grid">
      <div className="echo-map-stage" aria-busy={preparing}>
        <EchoBasemap key={mapRetry} center={center} point={point} showWildfireZones={wildfireAvailable && showWildfireZones} wildfireOpacity={wildfireOpacity}
          earthquakes={showEarthquakes ? earthquakes : noEarthquakes} selectedEarthquakeId={selectedEarthquakeId}
          onEarthquakeSelect={selectEarthquake} onShowEarthquakes={() => selectEarthquake(null)} focusPoints={focusPoints}
          focusRevision={focusRevision} preparing={preparing}
          earthquakesStale={earthquakeSource?.status === "checked" && earthquakeSource.isStale}
          earthquakesCheckedAt={earthquakeSource?.status === "checked" ? earthquakeSource.checkedAt : undefined}
          onPan={setCenter} onSelect={selectPoint} onMapIssue={setMapIssue} />
        {preparing && <div className="echo-location-loading" role="status">
          <h2>Preparing this location</h2>
          <p>Resolving the jurisdiction and checking government sources.</p>
          <p className="caption">The map will appear when the check finishes. Missing coverage stays visible.</p>
        </div>}
      </div>
      <RightPanel tab={tab} onTab={setTab} regionId="los-angeles"
        layersContent={<EchoLayerPanel wildfireAvailable={wildfireAvailable} showWildfireZones={showWildfireZones}
          setShowWildfireZones={setShowWildfireZones} opacity={wildfireOpacity} setOpacity={setWildfireOpacity}
          earthquakesAvailable={earthquakes.length > 0} showEarthquakes={showEarthquakes} setShowEarthquakes={setShowEarthquakes}
          mapIssue={mapIssue} reload={() => { setMapIssue(null); setMapRetry((value) => value + 1); }} />}
        evidenceContent={<><EchoEvidence result={result} /><GovernmentDiscoveryPanel collection={collection} /></>}
        notesIntro="Official alerts and orders take priority. Notes apply to this visit.">
        <h2>Point analysis</h2>
        <p className="caption">Click the map or enter coordinates to check this location.</p>
        <form className="echo-point-form" onSubmit={submitPoint}>
          <div>
            <label className="field-label">Latitude<input name="latitude" type="number" min="-90" max="90" step="any" required value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label>
            <label className="field-label">Longitude<input name="longitude" type="number" min="-180" max="180" step="any" required value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label>
          </div>
          {inputError && <p role="alert">{inputError}</p>}
          <button className="primary-button" type="submit">Check point</button>
          <button className="text-link" type="button" disabled={refreshing || collection.searching}
            onClick={() => { setRefresh((value) => value + 1); collection.retry(); }}>
            {refreshing ? "Refreshing..." : "Refresh data"}
          </button>
          <div className="echo-point-actions">
            <button type="button" className="text-link" onClick={() => setCenter({ ...point })}>Show selected point</button>
            <button type="button" className="text-link" disabled={locating} onClick={locateDevice}>
              {locating ? "Finding your location..." : "Use device location"}
            </button>
          </div>
        </form>
        <div aria-live="polite">
          {refreshing && <p className="caption">Refreshing sources. Showing the previous check below.</p>}
          {!completed ? <p className="caption">Checking connected sources for this location...</p>
            : result ? <EchoFindings result={result} onAlert={setSelectedAlert} />
            : <p className="missing-value">Not enough data. The point lookup could not be reached.</p>}
        </div>
        <LocalContextFindings collection={collection} onEvidence={() => setTab("Evidence")} />
        {sourceFailure && <p className="caption" role="status">Some connected sources are unavailable or out of date. See Evidence for source status and dates.</p>}
        {result?.alerts.status === "unavailable" && result.alerts.outOfCoverage &&
          <p className="caption">Current local alert coverage has not been verified. Check the issuing local authority for active notices.</p>}
        {result && <EarthquakeFindings key={`${point.latitude},${point.longitude}`} source={result.earthquake}
          selectedId={selectedEarthquakeId} onSelect={selectEarthquake} onShowAll={() => selectEarthquake(null)} />}
      </RightPanel>
    </div>
    {selectedAlert && <NwsAlertDetail alert={selectedAlert} onClose={() => setSelectedAlert(null)} />}
  </div>;
}
