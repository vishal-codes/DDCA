export type RegionId = "jakarta" | "lisbon" | "los-angeles";

export type Region = {
  id: RegionId;
  name: string;
  location: string;
  description: string;
  previewKinds: readonly string[];
};
