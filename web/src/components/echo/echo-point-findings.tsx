import { CAL_FIRE_SOURCE } from "@/lib/data/wildfire";
import { NWS_SOURCE, type NwsAlert } from "@/lib/data/nws-alerts";
import type { EchoPointResult } from "@/lib/data/echo-point";
import { formatSampleDate } from "@/lib/format-date";
import { DataAgeChip } from "@/components/shared/data-age-chip";

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="text-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export function WildfireSource({ checkedAt }: { checkedAt?: string }) {
  return <div className="caption">
    <SourceLink href={CAL_FIRE_SOURCE.mapUrl}>{CAL_FIRE_SOURCE.name}</SourceLink>
    <p>Map dated <time dateTime={CAL_FIRE_SOURCE.mapDate}>{CAL_FIRE_SOURCE.mapDate}</time>.
      {" "}Effective <time dateTime={CAL_FIRE_SOURCE.effectiveDate}>{CAL_FIRE_SOURCE.effectiveDate}</time>.</p>
    {checkedAt && <p>Checked <time dateTime={checkedAt}>{formatSampleDate(checkedAt)}</time>.</p>}
  </div>;
}

export function EchoFindings({ result, onAlert }: { result: EchoPointResult; onAlert: (alert: NwsAlert) => void }) {
  const { wildfire, alerts } = result;
  const finding = wildfire.status === "checked" ? wildfire.data : null;
  return <>
    <section className="evidence-entry">
      <h3>National Weather Service alerts</h3>
      {alerts.status === "unavailable" ? <p className="missing-value">Not enough data. The NWS feed could not be checked.</p>
        : alerts.data.length === 0 ? <p>No active NWS alerts were returned at the last check.</p>
        : <ul className="echo-alert-list">{alerts.data.map((alert) => <li key={alert.url}>
          <button className="text-link echo-alert-title" type="button" aria-haspopup="dialog" onClick={() => onAlert(alert)}>{alert.headline}</button>
          <p className="caption">Issued <time dateTime={alert.sent}>{formatSampleDate(alert.sent)}</time>.
            {" "}Message expires <time dateTime={alert.expires}>{formatSampleDate(alert.expires)}</time>.</p>
        </li>)}</ul>}
      <div className="caption">
        <SourceLink href={NWS_SOURCE.url}>National Weather Service</SourceLink>
        {alerts.status === "checked" && <p>Checked <DataAgeChip updatedAt={alerts.checkedAt} /></p>}
      </div>
    </section>
    <section className="evidence-entry">
      <h3>Long-term wildfire hazard</h3>
      {finding?.status === "match" ? <>
        <div className="wildfire-finding">
          <span className={`chip risk-chip risk-${finding.category === "Very High" ? "extreme" : finding.category.toLowerCase()}`}>
            <span className="risk-icon" aria-hidden="true" />{finding.category}
          </span>
          <span className="chip estimated-tag">Estimated</span>
        </div>
        <p>This point intersects a CAL FIRE zone. CAL FIRE models long-term fire hazard using fuels, terrain, and typical fire weather.</p>
      </> : <p className="missing-value">Not enough data. {finding?.status === "ambiguous"
        ? `The point intersects zones with different categories (${finding.categories.join(", ")}).`
        : finding ? "This point has no match in the State Responsibility Area layer." : "The CAL FIRE layer could not be checked."}</p>}
      <WildfireSource checkedAt={wildfire.status === "checked" ? wildfire.checkedAt : undefined} />
    </section>
  </>;
}

export function NwsBanner({ alert, checkedAt, onAlert }: {
  alert: NwsAlert; checkedAt: string; onAlert: () => void;
}) {
  return <aside className="official-banner" aria-label="Official National Weather Service alert">
    <span className="chip official-label"><span className="status-icon" aria-hidden="true" />Official alert</span>
    <div>
      <p>{alert.headline}</p>
      <p className="caption">National Weather Service. Issued <time dateTime={alert.sent}>{formatSampleDate(alert.sent)}</time>.</p>
    </div>
    <DataAgeChip updatedAt={checkedAt} />
    <button type="button" className="text-link" aria-haspopup="dialog" onClick={onAlert}>View alert</button>
  </aside>;
}
