import { Dialog } from "@/components/shared/dialog";
import { NWS_SOURCE, type NwsAlert } from "@/lib/data/nws-alerts";
import { formatSampleDate } from "@/lib/format-date";

export function NwsAlertDetail({ alert, onClose }: { alert: NwsAlert; onClose: () => void }) {
  return <Dialog title="Official weather alert" onClose={onClose}>
    <article className="echo-alert-detail">
      <h3>{alert.headline}</h3>
      <p className="caption">{NWS_SOURCE.name}. Issued <time dateTime={alert.sent}>{formatSampleDate(alert.sent)}</time>.
        {" "}Message expires <time dateTime={alert.expires}>{formatSampleDate(alert.expires)}</time>.</p>
      {alert.area && <section><h3>Affected areas</h3><p>{alert.area}</p></section>}
      <section><h3>Alert text</h3>
        <p className="echo-alert-text">{alert.description ?? "The source did not include alert text."}</p>
      </section>
      {alert.instruction && <section><h3>Official instructions</h3><p className="echo-alert-text">{alert.instruction}</p></section>}
      <a className="text-link" href={alert.url} target="_blank" rel="noopener noreferrer">Official NWS record (JSON)</a>
    </article>
  </Dialog>;
}
