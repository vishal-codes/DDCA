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
      {alert.webUrl ? <>
        <a className="text-link" href={alert.webUrl} target="_blank" rel="noopener noreferrer">Official NWS alert bulletin</a>
        <p className="caption">The official page may show newer bulletins. The issued time and alert text above identify this saved notice.</p>
      </> : <p className="caption">A readable official bulletin link was not supplied for this notice. The official alert text is shown above.</p>}
    </article>
  </Dialog>;
}
