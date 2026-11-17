import { CAL_FIRE_SOURCE, type WildfireCategory } from "@/lib/data/wildfire";
import { NWS_SOURCE, type NwsAlert } from "@/lib/data/nws-alerts";
import type { EchoPointResult } from "@/lib/data/echo-point";
import { formatSampleDate } from "@/lib/format-date";
import { DataAgeChip } from "@/components/shared/data-age-chip";

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="text-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export function WildfireCategoryChip({ category }: { category: WildfireCategory }) {
  return <span className={`chip risk-chip risk-${category === "Very High" ? "extreme" : category.toLowerCase()}`}>
    <span className="risk-icon" aria-hidden="true" />{category}
  </span>;
}

export function WildfireSource({ checkedAt, isStale, staleReason }: { checkedAt?: string; isStale?: boolean; staleReason?: string }) {
  return <div className="caption">
    <SourceLink href={CAL_FIRE_SOURCE.mapUrl}>{CAL_FIRE_SOURCE.name}</SourceLink>
    <p>Map dated <time dateTime={CAL_FIRE_SOURCE.mapDate}>{CAL_FIRE_SOURCE.mapDate}</time>.
      {" "}Effective <time dateTime={CAL_FIRE_SOURCE.effectiveDate}>{CAL_FIRE_SOURCE.effectiveDate}</time>.</p>
    {checkedAt && <p>Checked <DataAgeChip updatedAt={checkedAt} isStale={isStale} /></p>}
    {staleReason && <p>{staleReason}</p>}
  </div>;
}

export function EchoFindings({ result, onAlert }: { result: EchoPointResult; onAlert: (alert: NwsAlert) => void }) {
  const { wildfire, alerts } = result;
  const finding = wildfire.status === "checked" ? wildfire.data : null;
  const hasAlerts = alerts.status === "checked" && alerts.data.length > 0;
  const hasWildfireFinding = finding?.status === "match" || finding?.status === "ambiguous";
  return <>
    {hasAlerts && <section className="evidence-entry">
      <h3>National Weather Service alerts</h3>
      <ul className="echo-alert-list">{alerts.data.map((alert) => <li key={alert.url}>
          <button className="text-link echo-alert-title" type="button" aria-haspopup="dialog" onClick={() => onAlert(alert)}>{alert.headline}</button>
          <p className="caption">Issued <time dateTime={alert.sent}>{formatSampleDate(alert.sent)}</time>.
            {" "}Message expires <time dateTime={alert.expires}>{formatSampleDate(alert.expires)}</time>.</p>
        </li>)}</ul>
      <div className="caption">
        <SourceLink href={NWS_SOURCE.url}>National Weather Service</SourceLink>
        <p>Checked <DataAgeChip updatedAt={alerts.checkedAt} isStale={alerts.isStale} /></p>
        {alerts.staleReason && <p>{alerts.staleReason}</p>}
      </div>
    </section>}
    {hasWildfireFinding && <section className="evidence-entry">
      <h3>Long-term wildfire hazard</h3>
      {finding?.status === "match" ? <>
        <div className="wildfire-finding">
          <WildfireCategoryChip category={finding.category} />
          <span className="chip estimated-tag">Estimated</span>
        </div>
        <p>This point intersects a CAL FIRE zone. CAL FIRE models long-term fire hazard using fuels, terrain, and typical fire weather.</p>
      </> : <p className="missing-value">Not enough data. {finding?.status === "ambiguous" &&
        `The point intersects zones with different categories (${finding.categories.join(", ")}).`}</p>}
      <WildfireSource checkedAt={wildfire.status === "checked" ? wildfire.checkedAt : undefined}
        isStale={wildfire.status === "checked" && wildfire.isStale}
        staleReason={wildfire.status === "checked" ? wildfire.staleReason : undefined} />
    </section>}
  </>;
}

export function NwsBanner({ alert, checkedAt, isStale, staleReason, onAlert }: {
  alert: NwsAlert; checkedAt: string; isStale?: boolean; staleReason?: string; onAlert: () => void;
}) {
  return <aside className="official-banner" aria-label="Official National Weather Service alert">
    <span className="chip official-label"><span className="status-icon" aria-hidden="true" />Official alert</span>
    <div>
      <p>{alert.headline}</p>
      <p className="caption">National Weather Service. Issued <time dateTime={alert.sent}>{formatSampleDate(alert.sent)}</time>.</p>
      {staleReason && <p className="caption">{staleReason}</p>}
    </div>
    <DataAgeChip updatedAt={checkedAt} isStale={isStale} />
    <button type="button" className="text-link" aria-haspopup="dialog" onClick={onAlert}>View alert</button>
  </aside>;
}
