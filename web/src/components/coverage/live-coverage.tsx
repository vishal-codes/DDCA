import type { EchoCoverage } from "@/components/shell/app-shell";
import { EARTHQUAKE_SOURCE } from "@/lib/data/earthquakes";
import { CAL_FIRE_SOURCE } from "@/lib/data/wildfire";
import { NWS_SOURCE } from "@/lib/data/nws-alerts";
import { StatusChip } from "@/components/shared/status-chip";
import { DataAgeChip } from "@/components/shared/data-age-chip";
import { sourceApplies } from "@/lib/data/echo-point";

export function LiveCoverage({ coverage }: { coverage: EchoCoverage | null }) {
  const result = coverage?.result;
  const sources = [
    { name: "Weather alerts", source: NWS_SOURCE.name, url: NWS_SOURCE.url, value: result?.alerts, status: "live" as const },
    { name: "California wildfire map", source: CAL_FIRE_SOURCE.name, url: CAL_FIRE_SOURCE.mapUrl, value: result?.wildfire, status: "static_map" as const },
    { name: "Observed earthquakes", source: EARTHQUAKE_SOURCE.name,
      url: result?.earthquake?.status === "checked" ? result.earthquake.data.catalogUrl : undefined,
      value: result?.earthquake, status: "live" as const },
  ];
  return <>
    <p className="coverage-summary">{coverage
      ? `Selected point ${coverage.point.latitude.toFixed(4)}, ${coverage.point.longitude.toFixed(4)}.`
      : "Choose a point to check source coverage."}</p>
    {coverage?.pending && <p role="status">Checking sources for this point...</p>}
    {sources.filter(({ value }) => sourceApplies(value)).map(({ name, source, url, value, status }) => <section className="evidence-entry" key={name}>
      <h3>{name}</h3>
      <StatusChip status={value?.status === "checked" &&
        !(name === "California wildfire map" && "status" in value.data && value.data.status === "unavailable")
        ? status : "not_available"} />
      <p>{url ? <a className="text-link" href={url} target="_blank" rel="noopener noreferrer">{source}</a> : source}</p>
      {value?.status === "checked"
        ? <DataAgeChip updatedAt={value.checkedAt} isStale={value.isStale} />
        : <p className="caption">{value?.reason ?? "Not enough data."}</p>}
    </section>)}
    <section className="evidence-entry">
      <h3>Local flood, landslide and other hazard sources</h3>
      <p>Government-source collection appears in ECHO for the selected point. Source findings retain their dates and links.</p>
    </section>
    <section className="evidence-entry">
      <h3>Road closures, evacuation zones and population</h3><StatusChip status="not_available" />
    </section>
  </>;
}
