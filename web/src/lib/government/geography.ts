import type { EvidenceArea, GovernmentJurisdiction } from "./types";

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function includesName(text: string, name: string) {
  const value = normalize(text);
  const aliases = [name, ...name.split(/[-\u2010-\u2015]/)].map(normalize).filter((part) => part.length >= 3);
  return aliases.some((alias) => ` ${value} `.includes(` ${alias} `));
}

export function evidenceArea(text: string, jurisdiction?: GovernmentJurisdiction): EvidenceArea | undefined {
  if (!jurisdiction) return undefined;
  for (const level of ["city", "district", "state"] as const) {
    const name = jurisdiction[level];
    if (name && includesName(text, name)) return { name, level };
  }
}

export function localEvidence<T extends { area?: EvidenceArea }>(sources: readonly T[]) {
  return sources.filter((source) => source.area?.level === "city" || source.area?.level === "district");
}
