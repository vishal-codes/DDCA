"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { RegionSearch } from "./region-search";
import { useAppShell } from "./app-shell";

export function TopBar() {
  const { regionId, openCoverage, clearRegion } = useAppShell();
  return (
    <header className="top-bar">
      <Link href="/" className="brand" onClick={clearRegion} aria-label="SafeEarth home">
        <span className="brand-mark" aria-hidden="true" />SafeEarth
      </Link>
      <RegionSearch key={regionId ?? "none"} />
      <nav aria-label="Workspace" className="mode-nav">
        {["ECHO", "NET", "SERA"].map((mode) => (
          <button key={mode} type="button" className="mode-tab" disabled title="Screen not available yet">{mode}</button>
        ))}
      </nav>
      <div className="top-bar-actions">
        <button type="button" className="coverage-trigger" onClick={openCoverage} aria-haspopup="dialog">Data in this area</button>
        <button type="button" className="primary-button ask-trigger" disabled title="Ask is not available yet">Ask</button>
        <ThemeToggle />
      </div>
    </header>
  );
}
