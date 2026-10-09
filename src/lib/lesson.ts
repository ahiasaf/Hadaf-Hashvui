export type Point = { line: number; x: number };
export type Mark = {
  id?: string;
  also?: string[];
  cont?: boolean | number;
  g?: { from: Point; to: Point };
  c?: { text?: string; h?: string };
};
export type PageData = {
  w: number;
  h: number;
  prev?: number;
  prevDaf?: string;
  zones: { a: number; b: number; lines: number[][] }[];
  steps: Mark[];
};
export type LessonPage = {
  daf: string;
  page: number;
  data: PageData;
  take?: number;
};
export type Segment = {
  page: number;
  mark: Mark;
  number: number;
  id: string;
  aliases: string[];
  continuation: boolean;
  parts: number;
  part: number;
};
export function dafKey(value: string) {
  return value.replace(/["'׳״\s]/g, "");
}
export function parseLesson(
  rows: string[][],
  track: string,
  daf: string,
  amud = 0,
) {
  const mine: LessonPage[] = [];
  let tail: LessonPage | undefined;
  for (const row of rows) {
    const [source, number] = (row[2] || "").split("|");
    if (row[0] !== track || source !== "0") continue;
    let data: PageData;
    try {
      data = JSON.parse(row[3]);
    } catch {
      continue;
    }
    if (!data?.steps?.length || !Array.isArray(data.zones)) continue;
    const page = Number(number) || 1;
    if (dafKey(row[1]) === dafKey(daf)) mine.push({ daf, page, data });
    else if (
      page === 1 &&
      Number(data.prev) > 0 &&
      dafKey(data.prevDaf || "") === dafKey(daf)
    )
      tail = { daf: row[1], page, data, take: data.prev };
  }
  mine.sort((a, b) => a.page - b.page);
  const skip = mine[0]?.page === 1 ? mine[0].data.prev || 0 : 0;
  const pages = tail ? [...mine, tail] : mine;
  const segments: Segment[] = [];
  let groups = 0;
  pages.forEach((page, index) => {
    const from = index === 0 && page !== tail ? skip : 0;
    const until = page.take ?? page.data.steps.length;
    for (let i = from; i < Math.min(until, page.data.steps.length); i++) {
      const mark = page.data.steps[i];
      const previous = segments.at(-1);
      const continuation = !!mark.cont && !!previous;
      segments.push({
        page: index,
        mark,
        number: continuation ? previous!.number : ++groups,
        id: continuation ? previous!.id : mark.id || "",
        aliases: continuation ? previous!.aliases : mark.also || [],
        continuation,
        parts: 1,
        part: 1,
      });
    }
  });
  // Count continuation parts in one pass, preserving stable IDs and display order.
  const counts = new Map<number, number>();
  const positions = new Map<number, number>();
  for (const segment of segments)
    counts.set(segment.number, (counts.get(segment.number) || 0) + 1);
  for (const segment of segments) {
    segment.parts = counts.get(segment.number)!;
    segment.part = (positions.get(segment.number) || 0) + 1;
    positions.set(segment.number, segment.part);
  }
  const allowed = new Set<number>();
  for (const segment of segments) {
    if (segment.part !== 1) continue;
    const page = pages[segment.page];
    const belongsTo =
      dafKey(page.daf) === dafKey(daf) ? (page.page === 2 ? 2 : 1) : 2;
    if (!amud || belongsTo === amud) allowed.add(segment.number);
  }
  const filtered = segments.filter((segment) => allowed.has(segment.number));
  return { pages, segments: filtered, groups };
}
export function segmentRects(page: PageData, mark: Mark) {
  if (!mark.g) return [];
  const lines = page.zones
    .flatMap((zone) =>
      zone.lines.map((line) => ({
        left: zone.a,
        right: zone.b,
        top: line[0],
        bottom: line[1],
      })),
    )
    .sort((a, b) => a.top - b.top);
  const { from, to } = mark.g;
  const first = Math.min(from.line, to.line),
    last = Math.max(from.line, to.line);
  const start = from.line <= to.line ? from.x : to.x,
    end = from.line <= to.line ? to.x : from.x;
  return lines.slice(first, last + 1).map((line, index) => {
    const right =
      index === 0 ? line.right - (line.right - line.left) * start : line.right;
    const left =
      first + index === last
        ? line.right - (line.right - line.left) * end
        : line.left;
    return {
      left: Math.min(left, right),
      top: line.top,
      width: Math.abs(right - left),
      height: line.bottom - line.top,
    };
  });
}

export function marksQuery(track: string, names: string[]) {
  const literal = (value: string) =>
    !value.includes("'")
      ? "'" + value + "'"
      : !value.includes('"')
        ? '"' + value + '"'
        : null;
  const forms = [
    ...new Set(names.filter(Boolean).flatMap((name) => [name, dafKey(name)])),
  ];
  const filters = forms
    .map(literal)
    .filter(Boolean)
    .map((value) => "B = " + value);
  return filters.length
    ? "select A,B,C,D where A = " +
        literal(track) +
        " and (" +
        filters.join(" or ") +
        ")"
    : "";
}
