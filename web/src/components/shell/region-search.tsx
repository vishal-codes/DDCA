"use client";

import { useId, useState } from "react";
import { getRegions } from "@/lib/data/regions";
import { useAppShell } from "./app-shell";

export function RegionSearch({ large = false }: { large?: boolean }) {
  const id = useId();
  const [error, setError] = useState("");
  const { regionId, selectRegion } = useAppShell();
  const regions = getRegions();
  const selected = regions.find((region) => region.id === regionId);

  return (
    <form role="search" aria-label={large ? "Find a region" : "Change region"}
      className={`region-search${large ? " region-search-large" : ""}`}
      onSubmit={(event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("region") ?? "").trim().toLowerCase();
        const matches = value ? regions.filter((region) =>
          region.name.toLowerCase().includes(value) || region.location.toLowerCase().includes(value) || `${region.name}, ${region.location}`.toLowerCase() === value,
        ) : [];
        if (matches.length === 1) { setError(""); selectRegion(matches[0].id); }
        else setError("Choose Jakarta, Lisbon or Los Angeles from the sample regions.");
      }}>
      <label htmlFor={`${id}-input`} className="sr-only">City, region or country</label>
      <input key={regionId ?? "none"} id={`${id}-input`} name="region" type="search" list={`${id}-options`}
        placeholder="Search any city, region or country" autoComplete="off"
        defaultValue={selected ? `${selected.name}, ${selected.location}` : ""}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        onChange={() => setError("")} />
      <datalist id={`${id}-options`}>{regions.map((region) =>
        <option key={region.id} value={`${region.name}, ${region.location}`} />,
      )}</datalist>
      <button type="submit" className={large ? "primary-button" : "search-submit"} aria-label="Search regions">
        {large ? "Search" : "Go"}
      </button>
      {error && <p id={`${id}-error`} className="search-error" role="status">{error}</p>}
    </form>
  );
}
