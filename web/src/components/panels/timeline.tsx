"use client";

import { useEffect, useState } from "react";
import { getTimelineSample } from "@/lib/data/workspace";
import { formatSampleDate } from "@/lib/format-date";
import { SourceTag } from "@/components/shared/source-tag";
import { SampleCitation } from "@/components/shared/sample-citation";
import { useAppShell } from "@/components/shell/app-shell";
import { PreviewControl } from "@/components/shell/preview-control";

export function Timeline({ initialExpanded = false }: { initialExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [mode, setMode] = useState("Live");
  const [frame, setFrame] = useState(1);
  const [playing, setPlaying] = useState(false);
  const { regionId } = useAppShell();
  const sample = getTimelineSample(regionId);
  useEffect(() => {
    if (!playing || !expanded) return;
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % 3), 1500);
    return () => window.clearInterval(timer);
  }, [playing, expanded]);
  return <section className={`timeline${expanded ? " is-expanded" : ""}`} aria-label="Sample timeline">
    <div className="timeline-toolbar">
      {expanded ? <>
        <div className="timeline-modes" aria-label="Timeline mode">{["Live", "Forecast", "Replay"].map((item) => <button type="button" key={item} aria-pressed={mode === item} onClick={() => setMode(item)}>{item}</button>)}</div>
        <button type="button" className="text-button" onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"}</button>
        <input type="range" aria-label="Sample timeline frame" min="0" max="2" value={frame} onChange={(event) => setFrame(Number(event.target.value))} />
        <span className="caption">Sample: <time dateTime={sample.times[frame]}>{formatSampleDate(sample.times[frame])}</time></span>
      </> : <><strong>Timeline</strong><span className="chip">Sample data</span><span className="caption">Collapsed</span></>}
      <PreviewControl />
      <button type="button" className="text-button timeline-toggle" aria-expanded={expanded} aria-controls="timeline-charts" onClick={() => { setExpanded(!expanded); setPlaying(false); }}>{expanded ? "Hide" : "Show timeline"}</button>
    </div>
    {expanded && <div id="timeline-charts"><p className="timeline-note caption">{mode} layout preview. Sample frames only; no live history or forecast is computed.</p>
      <div className="timeline-charts">{sample.charts.map((chart) => <div className="surface-card timeline-chart" key={chart.title}>
        <p className="caption">{chart.title} <SourceTag kind={chart.kind} /></p>
        <svg viewBox="0 0 240 36" preserveAspectRatio="none" aria-hidden="true"><polyline points={chart.points} fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        <SampleCitation sourceName={chart.sourceName} updatedAt={sample.times[frame]} />
      </div>)}</div>
    </div>}
  </section>;
}
