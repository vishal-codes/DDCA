"use client";

import { useSyncExternalStore } from "react";
import { resolvePreviewState } from "@/lib/workspace";

function snapshot() {
  return resolvePreviewState(new URLSearchParams(window.location.search).get("state"), process.env.NODE_ENV === "development");
}
function serverSnapshot() { return "normal" as const; }
function subscribe(onChange: () => void) {
  if (process.env.NODE_ENV !== "development") return () => {};
  window.addEventListener("popstate", onChange);
  window.addEventListener("safeearth-preview", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("safeearth-preview", onChange);
  };
}
export function usePreviewState() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
