import settings from "../generated/settings.json" with { type: "json" };
import { backendState, WritesPaused } from "./database.ts";
import { legacyGetRoute, legacyPostRoute } from "./legacy-policy.ts";
// Same-origin replacement for direct Apps Script calls. The authoritative backend decides the handler.
export async function legacyAction(
  payload: Record<string, string>,
  request = fetch,
): Promise<unknown> {
  let params: Record<string, string> = {},
    body: Record<string, unknown> = {};
  if (payload.method === "GET") {
    params = Object.fromEntries(new URLSearchParams(payload.query || ""));
    delete params.callback;
    delete params.cb;
  } else if (payload.method === "POST") {
    const parsed: unknown = JSON.parse(payload.body || "");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("Invalid legacy request");
    body = parsed as Record<string, unknown>;
  } else throw new Error("Invalid legacy request");
  const route =
    payload.method === "GET" ? legacyGetRoute(params) : legacyPostRoute(body);
  // Drive file bytes never pass through the database or this function.
  if (route.name === "file") throw new Error("Files are served directly");
  const state = await backendState();
  if (state === "neon") {
    const { neonLegacyGet, neonLegacyPost } = await import("./legacy-neon.ts");
    return payload.method === "GET"
      ? neonLegacyGet(route.name, params)
      : neonLegacyPost(body);
  }
  if (state === "frozen" && route.write) throw new WritesPaused();
  // Before cutover the request reaches Apps Script exactly as the browser sent it, without server credentials.
  const url = new URL(settings.api);
  if (payload.method === "GET")
    for (const [key, value] of Object.entries(params))
      url.searchParams.set(key, value);
  const response = await request(url, {
    ...(payload.method === "POST"
      ? {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: payload.body,
        }
      : {}),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error("Upstream action failed");
  return response.json();
}
