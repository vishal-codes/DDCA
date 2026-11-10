import type { Region } from "@/types/region";

export const sampleRegions: readonly Region[] = [
  {
    id: "jakarta", name: "Jakarta", location: "Indonesia",
    description: "Coastal capital on the Java Sea.",
    previewKinds: ["Alerts", "Hazard maps", "Population"],
  },
  {
    id: "lisbon", name: "Lisbon", location: "Portugal",
    description: "Atlantic capital on the Tagus river.",
    previewKinds: ["Alerts", "Hazard maps", "Population"],
  },
  {
    id: "los-angeles", name: "Los Angeles", location: "California",
    description: "Foothills, basin and coast in Southern California.",
    previewKinds: ["Alerts", "Road closures", "Evacuation zones", "Hazard maps", "Population"],
  },
];
