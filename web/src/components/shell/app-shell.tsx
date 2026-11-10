"use client";

import { createContext, useContext, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { RegionId } from "@/types/region";
import type { PreviewState, WorkspaceMode } from "@/types/workspace";
import { parseWorkspacePath, workspaceHref } from "@/lib/workspace";
import { getRegions } from "@/lib/data/regions";
import { getOfficialSample } from "@/lib/data/workspace";
import { CoveragePanel } from "@/components/coverage/coverage-panel";
import { MethodsDialog } from "@/components/methods/methods-dialog";
import { AskDrawer } from "@/components/ask/ask-drawer";
import { Dialog } from "@/components/shared/dialog";
import { OfficialBanner } from "@/components/shared/official-banner";
import { Timeline } from "@/components/panels/timeline";
import { usePreviewState } from "./use-preview-state";
import { TopBar } from "./top-bar";
import { Footer } from "./footer";

type ShellState = {
  regionId: RegionId | null; mode: WorkspaceMode | null; previewState: PreviewState;
  selectRegion: (id: RegionId) => void; clearRegion: () => void;
  navigateMode: (mode: WorkspaceMode) => void;
  openCoverage: () => void; openMethods: () => void; openAsk: () => void;
};
const ShellContext = createContext<ShellState | null>(null);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const current = parseWorkspacePath(pathname);
  const regionId = current?.regionId ?? null;
  const previewState = usePreviewState();
  const [overlay, setOverlay] = useState<"coverage" | "methods" | "ask" | "regions" | null>(null);
  const [pendingMode, setPendingMode] = useState<WorkspaceMode>("echo");
  const official = regionId ? getOfficialSample(regionId, previewState) : null;
  function selectRegion(id: RegionId) {
    setOverlay(null);
    router.push(workspaceHref(id, current?.mode ?? (overlay === "regions" ? pendingMode : "echo"), previewState));
  }
  function navigateMode(mode: WorkspaceMode) {
    if (regionId) { setOverlay(null); router.push(workspaceHref(regionId, mode, previewState)); }
    else { setPendingMode(mode); setOverlay("regions"); }
  }
  return (
    <ShellContext.Provider value={{ regionId, mode: current?.mode ?? null, previewState,
      selectRegion, navigateMode, clearRegion: () => { setOverlay(null); setPendingMode("echo"); },
      openCoverage: () => setOverlay("coverage"), openMethods: () => setOverlay("methods"), openAsk: () => setOverlay("ask"),
    }}>
      <div className="app-shell">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <TopBar />
        {official && <OfficialBanner {...official} />}
        {previewState !== "normal" && <div className={`preview-notice preview-${previewState}`} role="status">
          <strong>{previewState === "offline" ? "Offline preview" : previewState === "stale" ? "Stale data preview" : "Wildfire preview"}</strong>
          <span>{previewState === "offline" ? "Showing cached sample data. This is not a connection check." : previewState === "stale" ? "Sample records may be out of date. Check official information." : "Sample scenario only. No current conditions are being reported."}</span>
        </div>}
        <main id="main-content" className="app-main">{children}</main>
        {pathname !== "/data-and-methods" && <Timeline key={pathname} initialExpanded={current?.mode === "echo"} />}
        <Footer />
      </div>
      {overlay === "coverage" && <CoveragePanel regionId={regionId} previewState={previewState} onClose={() => setOverlay(null)} />}
      {overlay === "methods" && <MethodsDialog onClose={() => setOverlay(null)} />}
      {overlay === "ask" && <AskDrawer key={`${regionId}-${previewState}`} onClose={() => setOverlay(null)} />}
      {overlay === "regions" && <Dialog title={`Choose a region for ${pendingMode.toUpperCase()}`} onClose={() => setOverlay(null)}>
        <p className="sample-note">Sample data. Choose an example region.</p>
        <div className="region-picker">{getRegions().map((region) => <button key={region.id} type="button" className="surface-card" onClick={() => selectRegion(region.id)}>{region.name}<span className="caption">{region.location}</span></button>)}</div>
      </Dialog>}
    </ShellContext.Provider>
  );
}
export function useAppShell() {
  const context = useContext(ShellContext);
  if (!context) throw new Error("useAppShell must be used within AppShell");
  return context;
}
