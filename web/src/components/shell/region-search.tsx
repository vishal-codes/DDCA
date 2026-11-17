"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getRegions } from "@/lib/data/regions";
import { getPlaceMatches, type PlaceMatch } from "@/lib/data/places";
import { useAppShell } from "./app-shell";

export function RegionSearch({ large = false }: { large?: boolean }) {
  const id = useId();
  const router = useRouter();
  const activeRequest = useRef<AbortController | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<PlaceMatch[]>([]);
  const { regionId, mode, selectRegion } = useAppShell();
  const regions = getRegions();
  const selected = regions.find((region) => region.id === regionId);
  const globalSearch = mode === null || mode === "echo";

  useEffect(() => () => activeRequest.current?.abort(), []);

  function clearResults() {
    activeRequest.current?.abort();
    setLoading(false);
    setMessage("");
    setMatches([]);
  }

  function openPlace(place: PlaceMatch) {
    clearResults();
    router.push(`/echo?latitude=${place.latitude}&longitude=${place.longitude}`);
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("region") ?? "").trim();
    clearResults();
    if (!query) {
      setMessage("Enter a place name or address.");
      return;
    }
    if (!globalSearch) {
      const value = query.toLowerCase();
      const workspaceMatches = regions.filter((region) =>
        region.name.toLowerCase().includes(value) || region.location.toLowerCase().includes(value) ||
        `${region.name}, ${region.location}`.toLowerCase() === value,
      );
      if (workspaceMatches.length === 1) selectRegion(workspaceMatches[0].id);
      else setMessage("Choose Jakarta, Lisbon or Los Angeles for this workspace.");
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setMessage("Searching places...");
    try {
      const found = await getPlaceMatches(query, controller.signal);
      if (controller.signal.aborted) return;
      if (found.length === 1) openPlace(found[0]);
      else {
        setMatches(found);
        setMessage(found.length > 1 ? "Choose the matching location." : "No matching place was found. Try a city, region or a fuller address.");
      }
    } catch {
      if (!controller.signal.aborted) setMessage("Place search could not be reached. Try again or choose a point on the map.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <form role="search" aria-label={globalSearch ? "Find a place" : "Change region"}
      className={`region-search${large ? " region-search-large" : ""}`} onSubmit={search}
      onKeyDown={(event) => {
        if (event.key === "Escape" && (message || matches.length)) {
          event.preventDefault();
          clearResults();
        }
      }}>
      <label htmlFor={`${id}-input`} className="sr-only">{globalSearch ? "City, region or address" : "City, region or country"}</label>
      <input key={regionId ?? "none"} id={`${id}-input`} name="region" type="search"
        list={globalSearch ? undefined : `${id}-options`}
        placeholder={globalSearch ? "Search a city, region or address" : "Choose a workspace region"} autoComplete="off"
        defaultValue={selected ? `${selected.name}, ${selected.location}` : ""}
        aria-describedby={message ? `${id}-status` : undefined}
        aria-controls={matches.length ? `${id}-matches` : undefined}
        onChange={clearResults} />
      {!globalSearch && <datalist id={`${id}-options`}>{regions.map((region) =>
        <option key={region.id} value={`${region.name}, ${region.location}`} />,
      )}</datalist>}
      <button type="submit" className={large ? "primary-button" : "search-submit"}
        aria-label="Search places" disabled={loading}>{large ? "Search" : "Go"}</button>
      {(message || matches.length > 0) && <div className="place-search-results">
        <p id={`${id}-status`} className="caption" role="status">{message}</p>
        {matches.length > 0 && <ul id={`${id}-matches`} aria-label="Matching places">
          {matches.map((place) => <li key={place.id}>
            <button type="button" onClick={() => openPlace(place)}>{place.name}</button>
          </li>)}
        </ul>}
      </div>}
    </form>
  );
}
