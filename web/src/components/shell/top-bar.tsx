"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { RegionSearch } from "./region-search";
import { useAppShell } from "./app-shell";
import type { WorkspaceMode } from "@/types/workspace";

export function TopBar() {
  const { regionId, mode: currentMode, openCoverage, clearRegion, navigateMode, openAsk } = useAppShell();
  return (
    <header className="top-bar">
      <Link href="/" className="brand" onClick={clearRegion} aria-label="SafeEarth home">
        <span className="brand-mark" aria-hidden="true" />SafeEarth
      </Link>
      <RegionSearch key={regionId ?? "none"} />
      <nav aria-label="Workspace" className="mode-nav">
        {(["echo", "net", "sera"] as WorkspaceMode[]).map((mode) => (
          <button key={mode} type="button" className={`mode-tab${mode === currentMode ? " is-active" : ""}`} aria-current={mode === currentMode ? "page" : undefined} onClick={() => navigateMode(mode)}>{mode.toUpperCase()}</button>
        ))}
      </nav>
      <div className="top-bar-actions">
        <button type="button" className="coverage-trigger" onClick={openCoverage} aria-haspopup="dialog">Data in this area</button>
        <button type="button" className="primary-button ask-trigger" onClick={openAsk} aria-haspopup="dialog">Ask</button>
        <ThemeToggle />
      </div>
    </header>
  );
}
