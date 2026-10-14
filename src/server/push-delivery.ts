import { Data, Effect } from "effect";
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
class DeliveryFailure extends Data.TaggedError("DeliveryFailure")<{
  readonly code?: number;
  readonly delay: number;
}> {}
const retryable = (failure: DeliveryFailure) =>
  failure.code === 429 || (failure.code !== undefined && failure.code >= 500);
export async function deliver(
  sender: PushSender,
  subscription: Subscription,
  payload: string,
  options: { TTL?: number; attempts?: number; timeout?: number } = {},
  sleep?: (ms: number) => Promise<void>,
): Promise<Delivery> {
  const maximum = options.attempts ?? 3;
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 3)
    throw new Error("Invalid delivery attempt limit");
  let attempt = 0;
  const send = Effect.tryPromise({
    try: async () => {
      attempt++;
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
      return result.statusCode;
    },
    catch: (error) => {
      const failure = (
        error && typeof error === "object" ? error : {}
      ) as Failure;
      const retryAfter =
        failure.headers?.["retry-after"] || failure.headers?.["Retry-After"];
      return new DeliveryFailure({
        code: failure.statusCode,
        delay:
          retryAfter && /^\d+$/.test(retryAfter)
            ? Math.min(30000, Number(retryAfter) * 1000)
            : Math.min(20000, 1000 * 2 ** attempt) +
              Math.floor(Math.random() * 700),
      });
    },
  }).pipe(
    Effect.tapError((failure) =>
      attempt < maximum && retryable(failure)
        ? sleep
          ? Effect.promise(() => sleep(failure.delay))
          : Effect.sleep(failure.delay)
        : Effect.void,
    ),
    Effect.retry({ times: maximum - 1, while: retryable }),
    Effect.withSpan("notification.deliver"),
    Effect.match({
      onSuccess: (code): Delivery => ({ ok: true, code, tries: attempt }),
      onFailure: ({ code }): Delivery =>
        !code
          ? {
              ok: false,
              uncertain: true,
              tries: attempt,
              err: "Push delivery acknowledgement missing",
            }
          : code === 404 || code === 410
            ? { ok: false, code, gone: true, tries: attempt }
            : {
                ok: false,
                code,
                tries: attempt,
                err: "Push service rejected delivery",
              },
    }),
  );
  return Effect.runPromise(send);
}
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number, signal: AbortSignal) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error("Invalid concurrency limit");
  // Structured workers stop scheduling siblings after a failure and preserve input order.
  return Effect.runPromise(
    Effect.forEach(
      items,
      (item, index) =>
        Effect.tryPromise({
          try: (signal) => fn(item, index, signal),
          catch: (error) => error,
        }),
      { concurrency: limit },
    ),
  );
}
