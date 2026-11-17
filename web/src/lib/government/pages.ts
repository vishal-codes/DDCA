import { officialSourceUrl } from "./evidence";
import type { GovernmentHazard } from "./types";

export const hazardPatterns: Record<GovernmentHazard, RegExp> = {
  wildfire: /wildfire|forest fire|bushfire|inc[e\u00ea]ndio|\u5c71\u706b|\u68ee\u6797\u706b\u707d/i,
  flood: /flood|inunda|\u6d2a\u6c34|\u6d78\u6c34/i,
  landslide: /landslide|debris flow|landslip|deslizamento|\u571f\u7802/i,
  earthquake: /earthquake|seismic|terremoto|sismo|\u5730\u9707/i,
};

function decode(value: string) {
  return value.replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_match, encoded: string) => {
    const number = encoded[0].toLowerCase() === "x" ? parseInt(encoded.slice(1), 16) : parseInt(encoded, 10);
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : "";
  }).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function text(value: string) {
  return decode(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function readGovernmentPage(html: string, url: string, domains: readonly string[]) {
  const title = text(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? new URL(url).hostname).slice(0, 240);
  const main = html.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const paragraphs = main.split(/<\/(?:p|div|li|h[1-6]|section|article)>/i).map(text).filter((line) => line.length >= 35);
  const links: string[] = [];
  for (const match of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    if (!Object.values(hazardPatterns).some((pattern) => pattern.test(match[1] + " " + text(match[2])))) continue;
    try {
      const target = officialSourceUrl(new URL(decode(match[1]), url).href, domains);
      if (target && !/\.(?:pdf|zip|jpg|png|mp4)(?:\?|$)/i.test(new URL(target).pathname)) links.push(target);
    } catch {
      // Ignore malformed links in source pages.
    }
  }
  let publishedAt: string | null = null;
  for (const match of html.matchAll(/<meta\b[^>]+>/gi)) {
    const attributes = new Map([...match[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((attribute) => [attribute[1].toLowerCase(), attribute[2]]));
    const name = attributes.get("property") ?? attributes.get("name");
    const date = attributes.get("content");
    if (name && /^(article:published_time|datePublished|dcterms\.date|pubdate)$/i.test(name) &&
        date && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(date) &&
        Number.isFinite(Date.parse(date))) { publishedAt = date; break; }
  }
  return { title, paragraphs, links: [...new Set(links)], publishedAt };
}

export async function fetchGovernmentPage(input: string, domains: readonly string[]) {
  let url = officialSourceUrl(input, domains);
  for (let redirects = 0; url && redirects <= 3; redirects++) {
    const response = await fetch(url, {
      redirect: "manual", signal: AbortSignal.timeout(7000),
      headers: { Accept: "text/html", "User-Agent": "SafeEarth/0.1 government-source collection" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      url = location ? officialSourceUrl(new URL(location, url).href, domains) : null;
      continue;
    }
    if (!response.ok || !response.headers.get("Content-Type")?.includes("text/html") || !response.body) return null;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let size = 0;
    try {
      while (size < 500000) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        html += decoder.decode(value, { stream: true });
      }
    } finally {
      await reader.cancel();
    }
    html += decoder.decode();
    return { url, ...readGovernmentPage(html, url, domains) };
  }
  return null;
}
