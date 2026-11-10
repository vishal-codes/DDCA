"use client";

import { createContext, useContext, useState } from "react";
import type { RegionId } from "@/types/region";
import { CoveragePanel } from "@/components/coverage/coverage-panel";
import { MethodsDialog } from "@/components/methods/methods-dialog";
import { TopBar } from "./top-bar";
import { Footer } from "./footer";

type ShellState = {
  regionId: RegionId | null;
  selectRegion: (id: RegionId) => void;
  clearRegion: () => void;
  openCoverage: () => void;
  openMethods: () => void;
};

const ShellContext = createContext<ShellState | null>(null);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [regionId, setRegionId] = useState<RegionId | null>(null);
  const [overlay, setOverlay] = useState<"coverage" | "methods" | null>(null);

  return (
    <ShellContext.Provider value={{
      regionId,
      selectRegion: (id) => { setRegionId(id); setOverlay("coverage"); },
      clearRegion: () => { setRegionId(null); setOverlay(null); },
      openCoverage: () => setOverlay("coverage"),
      openMethods: () => setOverlay("methods"),
    }}>
      <div className="app-shell">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <TopBar />
        <main id="main-content" className="app-main">{children}</main>
        <Footer />
      </div>
      {overlay === "coverage" && <CoveragePanel regionId={regionId} onClose={() => setOverlay(null)} />}
      {overlay === "methods" && <MethodsDialog onClose={() => setOverlay(null)} />}
    </ShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(ShellContext);
  if (!context) throw new Error("useAppShell must be used within AppShell");
  return context;
}
