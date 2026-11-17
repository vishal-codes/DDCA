export function EchoLayerPanel({ wildfireAvailable, showWildfireZones, setShowWildfireZones, opacity, setOpacity, mapIssue, reload,
  earthquakesAvailable = false, showEarthquakes = false, setShowEarthquakes }: {
  wildfireAvailable: boolean; showWildfireZones: boolean; setShowWildfireZones: (value: boolean) => void;
  opacity: number; setOpacity: (value: number) => void; mapIssue: string | null; reload: () => void;
  earthquakesAvailable?: boolean; showEarthquakes?: boolean; setShowEarthquakes?: (value: boolean) => void;
}) {
  return <>
    <h2>Map layers</h2>
    <p>Basemap and selected point. Map attribution identifies the provider.</p>
    {earthquakesAvailable && <label className="checkbox-label">
      <input type="checkbox" checked={showEarthquakes} onChange={(event) => setShowEarthquakes?.(event.target.checked)} />
      Observed earthquake epicenters
    </label>}
    {wildfireAvailable ? <>
      <label className="checkbox-label">
        <input type="checkbox" checked={showWildfireZones} onChange={(event) => setShowWildfireZones(event.target.checked)} />
        CAL FIRE wildfire hazard zones
      </label>
      <label className="echo-opacity-control">Zone opacity
        <input type="range" min="0" max="100" step="5" value={opacity} disabled={!showWildfireZones}
          onChange={(event) => setOpacity(Number(event.target.value))} />
      </label>
      <p className="caption">Published California State Responsibility Area boundaries. Analysis checks the selected point.</p>
    </> : <p className="missing-value">No verified hazard overlay is connected for this location. Local source documents appear under Evidence.</p>}
    {mapIssue && <p role="status">{mapIssue}</p>}
    <button type="button" className="text-link" onClick={reload}>Reload basemap</button>
  </>;
}
