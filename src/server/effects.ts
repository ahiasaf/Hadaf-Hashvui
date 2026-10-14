import { Data, Effect } from "effect";
import { WritesPaused } from "./database.ts";

class RequestFailure extends Data.TaggedError("RequestFailure")<{
  readonly paused: boolean;
}> {}

// Keep typed failures on the server. API responses never expose source errors or data.
export function runServerTask<A>(name: string, task: () => Promise<A>) {
  return Effect.runPromise(
    Effect.tryPromise({
      try: task,
      catch: (error) =>
        new RequestFailure({ paused: error instanceof WritesPaused }),
    }).pipe(
      Effect.withSpan(name),
      Effect.match({
        onSuccess: (value) => ({ ok: true as const, value }),
        onFailure: (error) => ({ ok: false as const, paused: error.paused }),
      }),
    ),
  );
}
