import type { WildfirePolygon } from "./wildfire-zones";

type Entry = { controller: AbortController; promise: Promise<WildfirePolygon[]>; data?: WildfirePolygon[] };
const empty: WildfirePolygon[] = [];

export function createWildfireZoneCache(load: (url: string, signal: AbortSignal) => Promise<WildfirePolygon[]>, limit = 8) {
  const entries = new Map<string, Entry>();
  const listeners = new Set<() => void>();
  let snapshot = empty;
  function publish() {
    const polygons = new Map<number, WildfirePolygon>();
    for (const entry of entries.values()) for (const polygon of entry.data ?? []) polygons.set(polygon.id, polygon);
    snapshot = [...polygons.values()];
    listeners.forEach((listener) => listener());
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => empty,
    peek: (url: string) => entries.get(url)?.data,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async read(url: string, signal: AbortSignal) {
      signal.throwIfAborted();
      let entry = entries.get(url);
      if (entry) {
        entries.delete(url);
        entries.set(url, entry);
        if (entry.data) publish();
      } else {
        if (entries.size >= limit) {
          const oldest = entries.keys().next().value!;
          entries.get(oldest)?.controller.abort();
          entries.delete(oldest);
          publish();
        }
        const controller = new AbortController();
        const created: Entry = { controller, promise: Promise.resolve(empty) };
        entry = created;
        entries.set(url, created);
        created.promise = load(url, controller.signal).then((data) => {
          if (entries.get(url) === created) { created.data = data; publish(); }
          return data;
        }, (error) => {
          if (entries.get(url) === created) { entries.delete(url); publish(); }
          throw error;
        });
      }
      const data = await entry.promise;
      signal.throwIfAborted();
      return data;
    },
  };
}
