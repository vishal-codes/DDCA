import { sampleTimestamp } from "./echo";

export const sampleTimeline = {
  times: ["2026-11-08T22:00:00Z", sampleTimestamp, "2026-11-08T22:30:00Z"],
  charts: [
    { title: "Official alert activity", kind: "Measured" as const, sourceName: "NWS (design sample)", points: "0,26 30,23 60,25 90,14 120,17 150,9 180,15 210,8 240,12" },
    { title: "Road status", kind: "Measured" as const, sourceName: "Caltrans (design sample)", points: "0,11 30,14 60,16 90,10 120,12 150,24 180,26 210,28 240,31" },
    { title: "Exposure example", kind: "Modeled" as const, sourceName: "Design reference; dataset undecided", points: "0,30 30,29 60,28 90,24 120,20 150,18 180,15 210,12 240,8" },
  ],
};
