import { SourceTag } from "@/components/shared/source-tag";

const rows = [
  ["Official alerts", "NWS alerts; CAL FIRE incidents", "Live alerts; polling interval undecided"],
  ["Road closures", "Caltrans lane closures", "Update and cancellation checks undecided"],
  ["Evacuation zones", "Cal OES zones; CAL FIRE evacuation status", "Update and cancellation checks undecided"],
  ["Hazard maps", "CAL FIRE official layers", "Published maps; retain source date"],
  ["Population", "Dataset and license undecided", "Update schedule undecided"],
];

export function MethodsContent() {
  return (
    <div className="methods-content">
      <p>ECHO accepts locations worldwide. It checks available government feeds and collects local government source evidence for the selected point. Views labeled Sample data use design examples.</p>
      <section><h3>Connected sources</h3>
        <p>USGS supplies worldwide earthquake observations. CAL FIRE supplies the California wildfire map, and NWS supplies alerts in its forecast areas. Each finding keeps its source date and check time.</p>
        <p>The government-source agent searches permitted official domains for the selected jurisdiction. Its summaries link to retrieved government pages. A new mapped hazard level needs a validated dataset covering that point.</p>
      </section>
      <div className="table-scroll"><table>
        <caption className="sr-only">Planned California sources and unresolved update schedules</caption>
        <thead><tr><th scope="col">Kind of data</th><th scope="col">California v1 source</th><th scope="col">Updates</th></tr></thead>
        <tbody>{rows.map(([kind, source, updates]) => <tr key={kind}><th scope="row">{kind}</th><td>{source}</td><td>{updates}</td></tr>)}</tbody>
      </table></div>
      <section><h3>How to read the map</h3>
        <p className="reading-key"><span className="pattern-swatch measured-swatch" aria-hidden="true" /><SourceTag kind="Measured" /> comes from sensors, official records or alerts.</p>
        <p className="reading-key"><span className="pattern-swatch modeled-swatch" aria-hidden="true" /><SourceTag kind="Modeled" /> is an estimate. Population exposure is estimated.</p>
        <p className="reading-key"><span className="pattern-swatch missing-swatch" aria-hidden="true" /><strong>Not enough data</strong> means we do not guess.</p>
      </section>
      <section><h3>Known limits</h3>
        <p>Official alerts and orders always outrank our scores. Risk in v1 comes from official layers. Our own risk model comes later.</p>
        <p>Road closures and evacuation zones appear only where a source exists. Coverage is shown per kind of data, with a source and date. Sources for other regions and the population dataset remain undecided.</p>
        <p>ECHO shows the date of each published map and the time each feed was checked. Refresh data repeats the source checks. A failed refresh keeps earlier evidence with an amber stale indicator.</p>
      </section>
    </div>
  );
}
