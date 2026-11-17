import { StatusChip } from "@/components/shared/status-chip";
import { DataAgeChip } from "@/components/shared/data-age-chip";
import { NWS_SOURCE } from "@/lib/data/nws-alerts";
import { EARTHQUAKE_SOURCE } from "@/lib/data/earthquakes";
import { sourceApplies, type EchoPointResult } from "@/lib/data/echo-point";
import { WildfireSource } from "./echo-point-findings";

export function EchoEvidence({ result }: { result: EchoPointResult | null }) {
  const wildfire = result?.wildfire;
  const alerts = result?.alerts;
  const earthquake = result?.earthquake;
  return <>
    <h2>Sources and dates</h2>
    <p className="caption">Each result applies to the selected point. Select a point or refresh to check the sources again.</p>
    {sourceApplies(earthquake) && <section className="evidence-entry">
      <h3>Observed earthquakes</h3>
      <StatusChip status={earthquake?.status === "checked" ? "live" : "not_available"} />
      <p>{earthquake?.status === "checked" && earthquake.data.catalogUrl
        ? <a className="text-link" href={earthquake.data.catalogUrl} target="_blank" rel="noopener noreferrer">{EARTHQUAKE_SOURCE.name} - selected area</a>
        : EARTHQUAKE_SOURCE.name}</p>
      <p className="caption">Catalog observations around the selected point.</p>
      {earthquake?.status === "checked" && <p className="caption">Checked <DataAgeChip updatedAt={earthquake.checkedAt} isStale={earthquake.isStale} /></p>}
      {earthquake?.status === "unavailable" && earthquake.reason && <p className="caption">{earthquake.reason}</p>}
      {earthquake?.status === "checked" && earthquake.staleReason && <p className="caption">{earthquake.staleReason}</p>}
    </section>}
    {sourceApplies(wildfire) && <section className="evidence-entry">
      <h3>Wildfire hazard</h3>
      <StatusChip status={wildfire?.status === "checked" ? "static_map" : "not_available"} />
      <p>Published model for California State Responsibility Areas.</p>
      {wildfire?.status === "unavailable" && wildfire.reason && <p className="caption">{wildfire.reason}</p>}
      <WildfireSource checkedAt={wildfire?.status === "checked" ? wildfire.checkedAt : undefined}
        isStale={wildfire?.status === "checked" && wildfire.isStale}
        staleReason={wildfire?.status === "checked" ? wildfire.staleReason : undefined} />
    </section>}
    {sourceApplies(alerts) && <section className="evidence-entry">
      <h3>Weather alerts</h3>
      <StatusChip status={alerts?.status === "checked" ? "live" : "not_available"} />
      <p><a className="text-link" href={NWS_SOURCE.url} target="_blank" rel="noopener noreferrer">{NWS_SOURCE.name}</a></p>
      <p className="caption">Active notices for the selected point. Official wording is available from each alert.</p>
      {alerts?.status === "checked" && <p className="caption">Checked <DataAgeChip updatedAt={alerts.checkedAt} isStale={alerts.isStale} /></p>}
      {alerts?.status === "unavailable" && alerts.reason && <p className="caption">{alerts.reason}</p>}
      {alerts?.status === "checked" && alerts.staleReason && <p className="caption">{alerts.staleReason}</p>}
    </section>}
  </>;
}
