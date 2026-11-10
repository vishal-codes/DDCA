"use client";

import type { SampleZone } from "@/types/workspace";
import { RiskChip } from "@/components/shared/risk-chip";
import { SourceTag } from "@/components/shared/source-tag";
import { SampleCitation } from "@/components/shared/sample-citation";

export function ZoneTable({ zones, selected, onSelect }: { zones: SampleZone[]; selected: string; onSelect: (id: string) => void }) {
  return <><h2>Zones</h2><p className="sample-note">Sample data. Select a zone to highlight it in the illustration.</p>
    <table className="zone-table"><caption className="sr-only">Sample zone analysis</caption><thead><tr><th scope="col">Zone</th><th scope="col">Hazard</th><th scope="col">Population exposure</th><th scope="col">Suggested action</th></tr></thead>
      <tbody>{zones.map((zone) => <tr key={zone.id} className={selected === zone.id ? "selected-row" : ""}>
        <th scope="row"><button type="button" aria-pressed={selected === zone.id} onClick={() => onSelect(zone.id)} aria-label={`Select zone ${zone.id}`}>{zone.id}</button></th>
        <td>{zone.risk ? <><RiskChip level={zone.risk} /><SourceTag kind={zone.kind} /></> : <span className="missing-value">Not enough data</span>}</td>
        <td className={zone.risk ? undefined : "missing-value"}>{zone.exposure}{zone.risk && <><br /><SourceTag kind="Modeled" /></>}</td><td>{zone.action}</td>
      </tr>)}</tbody>
    </table><SampleCitation sourceName={zones[0].sourceName} updatedAt={zones[0].updatedAt} />
    <p className="caption">Exposure figures are design examples; the population dataset is undecided.</p>
  </>;
}
