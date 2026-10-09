import fs from "node:fs";
import vm from "node:vm";
import type { Track } from "../lib/calendar.ts";
import { stringRecord } from "./database.ts";
export function notificationProgram() {
  const context: Record<string, unknown> = {};
  vm.runInNewContext(
    fs.readFileSync(new URL("../config/program.js", import.meta.url), "utf8"),
    context,
    { timeout: 1000 },
  );
  const metadata = context.PROGRAM as {
    startDate?: unknown;
    year?: unknown;
    earlyFrom?: unknown;
  };
  if (
    typeof metadata?.startDate !== "string" ||
    typeof metadata.year !== "string"
  )
    throw new Error("Invalid program metadata");
  const program = {
      startDate: metadata.startDate,
      year: metadata.year,
      earlyFrom:
        typeof metadata.earlyFrom === "string" ? metadata.earlyFrom : "",
    },
    digest = stringRecord(context.DIGEST),
    pair = stringRecord(context.PAIR);
  if (!Array.isArray(context.TRACKS))
    throw new Error("Notification calendar missing");
  const tracks: Track[] = context.TRACKS.map((value: unknown) => {
    if (!value || typeof value !== "object")
      throw new Error("Invalid notification track");
    const track = value as Record<string, unknown>;
    if (
      typeof track.id !== "string" ||
      typeof track.masechet !== "string" ||
      typeof track.dapim !== "number" ||
      !Array.isArray(track.cal) ||
      !track.cal.every(
        (row) =>
          Array.isArray(row) &&
          row.every(
            (cell: unknown) => cell === null || typeof cell === "string",
          ),
      )
    )
      throw new Error("Invalid notification calendar");
    return {
      id: track.id,
      name: track.masechet,
      dapim: track.dapim,
      cal: track.cal,
    };
  });
  return { program, digest, pair, tracks };
}
export function fillTemplate(
  text: string,
  values: Record<string, string | number>,
) {
  return text.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    values[key] === undefined ? placeholder : String(values[key]),
  );
}
