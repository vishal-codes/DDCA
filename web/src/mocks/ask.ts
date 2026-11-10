import { sampleTimestamp } from "./echo";

export const sampleQuestions = [
  { id: "alerts", question: "What alerts are active?", answer: "The sample includes an official weather advisory. Check the official source for current alerts and orders.", sourceName: "NWS Los Angeles (design sample)", href: "https://www.weather.gov/lox/", updatedAt: sampleTimestamp },
  { id: "roads", question: "Is my road open?", answer: "Foothill ramp access is unconfirmed in this sample. Check official road information before leaving.", sourceName: "Caltrans lane closures (design sample)", href: "https://roads.dot.ca.gov/", updatedAt: sampleTimestamp },
  { id: "shelter", question: "Where is the nearest shelter?", answer: "Emergency shelter A is shown as a sample destination. Its opening status and nearest location are not verified. Check official local guidance.", sourceName: "Design reference (sample shelter)", href: null, updatedAt: sampleTimestamp },
  { id: "coverage", question: "What data is available here?", answer: "The sample coverage panel lists each kind of data with a status, source and date. No live feeds are connected.", sourceName: "Sample region coverage", href: null, updatedAt: sampleTimestamp },
] as const;
