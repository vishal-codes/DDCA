"use client";

import { useAppShell } from "./app-shell";

export function PreviewControl() {
  const { previewState } = useAppShell();
  if (process.env.NODE_ENV !== "development") return null;
  return <label className="dev-preview">Preview
    <select aria-label="Development preview state" value={previewState} onChange={(event) => {
      const url = new URL(window.location.href);
      if (event.target.value === "normal") url.searchParams.delete("state");
      else url.searchParams.set("state", event.target.value);
      window.history.replaceState(null, "", url);
      window.dispatchEvent(new Event("safeearth-preview"));
    }}>{["normal", "wildfire", "stale", "offline"].map((state) => <option key={state}>{state}</option>)}</select>
  </label>;
}
