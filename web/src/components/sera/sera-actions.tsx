"use client";

import { useState } from "react";
import type { SampleSite } from "@/types/workspace";
import { Dialog } from "@/components/shared/dialog";

export function SeraActions({ sites }: { sites: SampleSite[] }) {
  const [dialog, setDialog] = useState<"share" | "depot" | null>(null);
  const [link, setLink] = useState("");
  const [notice, setNotice] = useState("");
  return <div className="sera-actions">
    <div className="chip-group"><button type="button" className="text-button" disabled={!sites.length} onClick={() => {
      const cells = (row: string[]) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",");
      const rows = [["Label", "Site", "Estimated coverage within 30 min", "Estimated coverage within 60 min", "Source", "Date"], ...sites.map((site) => ["Sample data", site.name, site.nearCoverage, site.farCoverage, site.sourceName, site.updatedAt])];
      const url = URL.createObjectURL(new Blob([rows.map(cells).join("\r\n")], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "safeearth-sample-sites.csv"; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice("Sample CSV prepared.");
    }}>Export sample</button><button type="button" className="text-button" onClick={() => { setLink(window.location.href); setNotice(""); setDialog("share"); }}>Share sample view</button></div>
    <button type="button" className="primary-button" onClick={() => { setNotice(""); setDialog("depot"); }}>Preview depot details</button>
    <p role="status" className="caption">{notice}</p>
    {dialog && <Dialog title={dialog === "share" ? "Share sample view" : "Sample depot details"} onClose={() => setDialog(null)}>
      {dialog === "share" ? <><p className="sample-note">This link opens the region and screen. Local notes and settings are not included.</p>
        <label className="field-label">Sample view link<input readOnly value={link} onFocus={(event) => event.target.select()} /></label>
        <button type="button" className="primary-button" onClick={async () => { try { await navigator.clipboard.writeText(link); setNotice("Link copied."); } catch { setNotice("Select and copy the link above."); } }}>Copy link</button>
      </> : <form className="depot-preview-form" onSubmit={(event) => { event.preventDefault(); setNotice("Sample details accepted for this preview. No depot registration was sent."); }}>
        <p className="sample-note">Sample form only. This does not register a real depot.</p>
        <label>Depot name<input required maxLength={100} /></label><label>Address<input required maxLength={160} /></label>
        <label>Type<select><option>Warehouse</option><option>Parking lot</option><option>Community center</option></select></label>
        <button type="submit" className="primary-button">Preview details</button>
      </form>}
      <p className="caption" role="status">{notice}</p>
    </Dialog>}
  </div>;
}
