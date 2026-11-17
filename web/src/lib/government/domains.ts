// Government namespaces and named national authorities. Domain overrides are reviewed server configuration.
const governmentDomains: Record<string, readonly string[]> = {
  us: ["weather.gov", "usgs.gov", "fema.gov", "noaa.gov", "ca.gov", "lacounty.gov"],
  jp: ["go.jp", "lg.jp"],
  id: ["go.id"],
  pt: ["gov.pt", "ipma.pt", "apambiente.pt", "icnf.pt"],
  gb: ["gov.uk"],
  au: ["gov.au"],
  nz: ["govt.nz"],
  ca: ["gc.ca", "canada.ca", "gov.bc.ca", "ontario.ca", "quebec.ca", "gov.ab.ca"],
  in: ["gov.in", "nic.in"],
  fr: ["gouv.fr"],
  de: ["bund.de", "dwd.de", "bgr.bund.de"],
  es: ["gob.es", "proteccioncivil.es", "aemet.es", "ign.es"],
  it: ["gov.it", "protezionecivile.gov.it", "ingv.it"],
  br: ["gov.br"],
  mx: ["gob.mx"],
  ar: ["gob.ar"],
  cl: ["gob.cl", "senapred.cl"],
  co: ["gov.co"],
  pe: ["gob.pe"],
  ec: ["gob.ec"],
  za: ["gov.za"],
  ke: ["go.ke"],
  ng: ["gov.ng"],
  gh: ["gov.gh"],
  tz: ["go.tz"],
  ug: ["go.ug"],
  rw: ["gov.rw"],
  cn: ["gov.cn"],
  kr: ["go.kr"],
  tw: ["gov.tw"],
  sg: ["gov.sg"],
  my: ["gov.my"],
  ph: ["gov.ph"],
  th: ["go.th"],
  vn: ["gov.vn"],
  pk: ["gov.pk"],
  bd: ["gov.bd"],
  np: ["gov.np"],
  lk: ["gov.lk"],
  ae: ["gov.ae"],
  sa: ["gov.sa"],
  tr: ["gov.tr"],
  il: ["gov.il"],
  ie: ["gov.ie"],
  nl: ["overheid.nl", "knmi.nl", "rijkswaterstaat.nl"],
  be: ["belgium.be", "meteo.be"],
  ch: ["admin.ch"],
  at: ["gv.at"],
  no: ["regjeringen.no", "nve.no", "met.no"],
  se: ["regeringen.se", "smhi.se", "msb.se"],
  fi: ["valtioneuvosto.fi", "ilmatieteenlaitos.fi"],
  dk: ["dmi.dk", "brs.dk"],
  pl: ["gov.pl"],
  cz: ["gov.cz", "chmi.cz"],
  gr: ["gov.gr"],
  ro: ["gov.ro"],
  bg: ["government.bg"],
  hr: ["gov.hr"],
  si: ["gov.si"],
  sk: ["gov.sk"],
  ua: ["gov.ua"],
};

const seedSources: Record<string, { title: string; url: string }[]> = {
  us: [
    { title: "National Weather Service alerts", url: "https://www.weather.gov/alerts" },
    { title: "USGS natural hazards", url: "https://www.usgs.gov/mission-areas/natural-hazards" },
  ],
  jp: [
    { title: "Japan Meteorological Agency", url: "https://www.jma.go.jp/jma/en/menu.html" },
    { title: "Geospatial Information Authority of Japan", url: "https://www.gsi.go.jp/ENGLISH/" },
  ],
  id: [
    { title: "BMKG", url: "https://www.bmkg.go.id/" },
    { title: "BNPB", url: "https://www.bnpb.go.id/" },
  ],
  pt: [
    { title: "IPMA", url: "https://www.ipma.pt/" },
    { title: "Portuguese Environment Agency", url: "https://apambiente.pt/" },
    { title: "National Emergency and Civil Protection Authority", url: "https://prociv.gov.pt/" },
  ],
  in: [
    { title: "India Meteorological Department", url: "https://mausam.imd.gov.in/" },
    { title: "National Disaster Management Authority", url: "https://ndma.gov.in/" },
  ],
};

function validDomain(value: unknown): value is string {
  return typeof value === "string" && value.length <= 253 &&
    /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(value) && !value.includes("..");
}

export function domainsForCountry(countryCode: string | null, overrides = process.env.GOVERNMENT_DOMAINS_JSON) {
  if (!countryCode) return [];
  const code = countryCode.toLowerCase();
  if (overrides?.trim()) {
    const mapping: unknown = JSON.parse(overrides);
    if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) throw new Error("Invalid government domain configuration.");
    const configured = (mapping as Record<string, unknown>)[code];
    if (configured !== undefined) {
      if (!Array.isArray(configured) || configured.length === 0 || configured.length > 100 || !configured.every(validDomain)) {
        throw new Error("Invalid government domain configuration.");
      }
      return [...new Set(configured.map((domain) => domain.toLowerCase()))];
    }
  }
  return [...(governmentDomains[code] ?? [])];
}

export function suggestedSourcesForCountry(countryCode: string | null, domains: readonly string[]) {
  const known = countryCode ? seedSources[countryCode] ?? [] : [];
  return known.filter((source) => {
    const hostname = new URL(source.url).hostname;
    return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  });
}

export function suggestedSourcesForPlace(place: { countryCode: string | null; name: string }, domains: readonly string[]) {
  const sources = suggestedSourcesForCountry(place.countryCode, domains);
  if (place.countryCode === "in" && /\bMaharashtra\b/i.test(place.name)) {
    sources.unshift({ title: "Maharashtra published hazard overview", url: "https://sdma.maharashtra.gov.in/en/hazard-vulnerability-risk-information/" });
    if (/\bThane\b/i.test(place.name)) sources.unshift(
      { title: "Thane district disaster management plan", url: "https://thane.nic.in/en/document-category/district-disaster-management-plan/" },
      { title: "Thane district disaster management authorities", url: "https://thane.nic.in/en/disaster-management/" },
    );
  }
  return sources.filter((source) => {
    const hostname = new URL(source.url).hostname;
    return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  });
}
