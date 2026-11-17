"use client";

import { useEffect, useState } from "react";
import type { WildfirePoint } from "@/lib/data/wildfire";
import type { GovernmentDiscoveryJob } from "@/lib/government/types";
import { getGovernmentDiscovery, startGovernmentDiscovery } from "@/lib/data/government-discovery";

export function useGovernmentDiscovery(point: WildfirePoint) {
  const pointKey = `${point.latitude},${point.longitude}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; attempt: number; job?: GovernmentDiscoveryJob; error?: string }>();
  const current = state?.key === pointKey && state.attempt === attempt ? state : undefined;
  const job = current?.job;

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let checks = 0;
    async function update(id?: string) {
      try {
        const result = id ? await getGovernmentDiscovery(id, controller.signal) : await startGovernmentDiscovery(point, controller.signal);
        if (controller.signal.aborted) return;
        setState({ key: pointKey, attempt, job: result });
        if (result.status === "queued" || result.status === "in_progress") {
          if (++checks < 18) timer = setTimeout(() => { void update(result.id); }, 5000);
          else setState({ key: pointKey, attempt, job: result, error: "The search is still running. Check again shortly." });
        }
      } catch {
        if (!controller.signal.aborted) setState({ key: pointKey, attempt, error: "Government-source collection could not be reached. Try again." });
      }
    }
    timer = setTimeout(() => { void update(); }, 1000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [point, pointKey, attempt]);

  return {
    job, error: current?.error,
    searching: !current || (!current.error && (job?.status === "queued" || job?.status === "in_progress")),
    retry: () => setAttempt((value) => value + 1),
  };
}
