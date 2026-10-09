import { database, databaseEnabled } from "../src/server/database.ts";
import { flushNotificationOutbox } from "../src/server/notification-outbox.ts";
import { boolean, failJob } from "./notification-runtime.mts";
async function main() {
  if (
    !databaseEnabled() ||
    process.env.HADAF_NOTIFICATION_DELIVERY !== "direct"
  )
    return;
  if (boolean(process.env.DRY_RUN)) {
    const rows =
      await database()`SELECT state,count(*)::int AS n FROM notification_outbox GROUP BY state`;
    console.log(JSON.stringify({ job: "outbox", dry: true, states: rows }));
    return;
  }
  console.log(
    JSON.stringify({
      job: "outbox",
      ...(await flushNotificationOutbox(undefined, 600000)),
    }),
  );
}
void main().catch(failJob);
