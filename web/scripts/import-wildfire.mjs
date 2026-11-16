import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  CAL_FIRE_SOURCE, readWildfireQueryResult, validateWildfirePoint,
  wildfireQueryUrl, WILDFIRE_SNAPSHOT_PATH,
} from "../src/lib/data/wildfire.ts";

async function importWildfirePoint(args) {
  if (args.length !== 2 || args.some((arg) => !arg.trim())) {
    throw new Error("Usage: pnpm import:wildfire <latitude> <longitude>");
  }
  const point = validateWildfirePoint(Number(args[0]), Number(args[1]));
  const response = await fetch(wildfireQueryUrl(point), { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`CAL FIRE query failed with HTTP ${response.status}.`);

  const zones = readWildfireQueryResult(await response.json());
  const snapshot = {
    sourceId: CAL_FIRE_SOURCE.id,
    point,
    retrievedAt: new Date().toISOString(),
    zones,
  };
  const path = resolve(WILDFIRE_SNAPSHOT_PATH);
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: "wx" });
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
  console.log(`Saved CAL FIRE point evidence to ${WILDFIRE_SNAPSHOT_PATH}.`);
  console.log(`Matching zones: ${zones.length}.`);
}

try {
  await importWildfirePoint(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  if (error.cause?.code) console.error(`Network error: ${error.cause.code}`);
  process.exitCode = 1;
}
