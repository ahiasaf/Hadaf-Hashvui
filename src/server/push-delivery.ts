import { pause } from "./operational-store.ts";
export type Subscription = {
  endpoint: string;
  keys: { auth: string; p256dh: string };
};
export type PushSender = {
  sendNotification: (
    subscription: Subscription,
    payload: string,
    options: { TTL: number; timeout: number },
  ) => Promise<{ statusCode?: number }>;
};
export type Delivery = {
  ok: boolean;
  code?: number;
  gone?: boolean;
  uncertain?: boolean;
  tries: number;
  err?: string;
};
type Failure = {
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
  message?: string;
};
export async function deliver(
  sender: PushSender,
  subscription: Subscription,
  payload: string,
  options: { TTL?: number; attempts?: number; timeout?: number } = {},
  sleep = pause,
): Promise<Delivery> {
  const maximum = options.attempts ?? 3;
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 3)
    throw new Error("Invalid delivery attempt limit");
  for (let attempt = 1; attempt <= maximum; attempt++) {
    try {
      const result = await sender.sendNotification(subscription, payload, {
        TTL: options.TTL ?? 3600,
        timeout: options.timeout ?? 15000,
      });
      if (
        typeof result.statusCode !== "number" ||
        result.statusCode < 200 ||
        result.statusCode >= 300
      )
        throw { statusCode: result.statusCode };
      return { ok: true, code: result.statusCode, tries: attempt };
    } catch (error) {
      const failure = (
          error && typeof error === "object" ? error : {}
        ) as Failure,
        code = failure.statusCode;
      if (!code)
        return {
          ok: false,
          uncertain: true,
          tries: attempt,
          err: "Push delivery acknowledgement missing",
        };
      if (code === 404 || code === 410)
        return { ok: false, code, gone: true, tries: attempt };
      if ((code && code !== 429 && code < 500) || attempt === maximum)
        return {
          ok: false,
          code,
          tries: attempt,
          err: code
            ? "Push service rejected delivery"
            : "Push service unavailable",
        };
      const retryAfter =
        failure.headers?.["retry-after"] || failure.headers?.["Retry-After"];
      const delay =
        retryAfter && /^\d+$/.test(retryAfter)
          ? Math.min(30000, Number(retryAfter) * 1000)
          : Math.min(20000, 1000 * 2 ** attempt) +
            Math.floor(Math.random() * 700);
      await sleep(delay);
    }
  }
  throw new Error("Unreachable delivery state");
}
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error("Invalid concurrency limit");
  const result = new Array<R>(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      result[current] = await fn(items[current], current);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return result;
}
