"use client";

import { useId, useState } from "react";
import { StatusChip } from "@/components/shared/status-chip";
import { SourceTag } from "@/components/shared/source-tag";
import type { CoverageStatus } from "@/types/coverage";

const descriptions: readonly { status: CoverageStatus; description: string }[] = [
  { status: "live", description: "This source publishes changing conditions. Check the source time to see when this view last checked it." },
  { status: "updated_daily", description: "This dataset is normally refreshed about once a day. Its source date shows the edition currently available." },
  { status: "static_map", description: "A published hazard map or boundary layer. Its effective date identifies which map edition is being shown." },
  { status: "global_model", description: "A model with worldwide coverage. Its estimates retain the model name, date and stated resolution." },
  { status: "not_available", description: "A usable source has not been verified for this location. Missing coverage stays gray and says Not enough data." },
];

export function DataLabelsGuide() {
  const id = useId();
  const [selected, setSelected] = useState<CoverageStatus | null>(null);
  return <section className="surface-card labels-guide" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>What the data labels mean</h2>
    <p className="caption">Select a label to see its meaning.</p>
    <div className="label-definitions">{descriptions.map(({ status, description }) => (
      <div key={status}>
        <button type="button" className="label-definition-toggle" aria-expanded={selected === status}
          aria-controls={`${id}-${status}`} onClick={() => setSelected(selected === status ? null : status)}>
          <StatusChip status={status} /><span aria-hidden="true">{selected === status ? "-" : "+"}</span>
        </button>
        <p id={`${id}-${status}`} className="caption label-definition" hidden={selected !== status}>{description}</p>
      </div>
    ))}</div>
    <p className="caption">Numbers are labeled <SourceTag kind="Measured" />, <SourceTag kind="Modeled" /> or Not enough data.</p>
  </section>;
}
