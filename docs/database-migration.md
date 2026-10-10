# PostgreSQL migration

The selected database is hosted Neon PostgreSQL, not a service on a personal machine. A separate free preview resource, `hadaf-hashvui-preview`, was provisioned in Frankfurt through the existing Vercel integration. Production Sheets and Apps Script remain authoritative until the production cutover marker is active.

The preview schema preserves every exported table, header, row order and metadata. Indexed people, device aliases and progress events provide relational queries without scanning whole sheets. The progress view joins merged device IDs, takes the maximum partial progress, and lets completion override earlier partial events. Unregistered device events are retained. Ambiguous aliases, invalid progress identities and missing required columns stop import.

## Import

Use a private JSON export with `version: 1`, an ISO `capturedAt`, and `tables: [{name, rows, metadata}]`. Each table's first row contains its headers. Include `לומדים` and `לימוד`. Keep real exports outside Git and restrict local file permissions. Never log row contents or database credentials.

```bash
rtk proxy node tools/import-database.mts /PRIVATE_PATH/snapshot.json
rtk proxy node --env-file=.env.neon-preview tools/import-database.mts /PRIVATE_PATH/snapshot.json --apply
```

The first command validates and reports counts only. The second requires a server-only `DATABASE_URL`, creates the schema and imports atomically. It refuses a previously imported target; use a separate database branch for another candidate. No existing source data is deleted. Verify table counts, canonical identities, parent relationships and complete/partial progress against the source before switching reads.

## Verified source import

The signed-in Firefox session supplied two identical captures of all 37 public and private tabs. The isolated `source-snapshot-20261009` Neon branch contains 7,663 source rows, 451 canonical people, 455 device aliases and 1,254 progress events. A cell-by-cell comparison verified every raw row and normalized record after the runtime migrations. The source remained read-only throughout. The default preview branch is still empty. This is a verified migration candidate, not the live production authority.

The synthetic `fixtures` branch separately verifies signup, device merging, parent matching, partial and completed progress, write acknowledgements, authorization, rollback on invalid progress, and team logging. Real participant rows are never used by browser tests or the public demo.

Run versioned runtime migrations on an existing imported candidate:

```bash
rtk proxy node tools/migrate-database.mts
rtk proxy node --env-file=.env.neon-preview tools/migrate-database.mts --apply
```

The dry run reports migration names and statement counts. Applying records checksums, takes a transaction lock, and commits all pending schema changes atomically. Editing an already applied migration is rejected. New imports apply the runtime schema in the import transaction.

## Runtime coverage

Every backend call now has a Neon handler with the Apps Script authorization rules, write acknowledgements and response shapes. Legacy management, lesson-tool and studio pages still address the Apps Script URL, but `src/shared/net.js` sends every such `fetch`, no-cors POST and JSONP request to `/api/action` as operation `legacy`. The server then serves it from the authoritative backend: Apps Script before cutover (forwarded unchanged, without server credentials), Neon after. Drive file downloads (`?file=`) stay direct because they read Drive, not the database.

Keys: `READ` is the coordinator `READ_KEY`, `TEAM` is `TEAM_KEY`, `k` is a school access code. Tests: `P` is `tests/legacy-policy.test.mjs`, `R` is `tests/legacy-routing.test.mjs`, `C` is `tests/database-cutover.test.mjs`, `D` is `tests/database-runtime.test.mjs`, `N` is the notification test files. `C`, `D` and `N` need a throwaway database URL.

| Capability                                                                                        | Callers                                                                                         | Apps Script                                          | Neon                                                      | Tests                   |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- | ----------------------- |
| Public tables (CSV)                                                                               | `src/lib/client.ts`, `net.js` gviz rewrite                                                      | gviz                                                 | `readDatabaseSheet`, live counter views                   | `public-query`, `cache` |
| Signup, progress, subscriptions, pair reports, waiting list (`row`, public columns only)          | `Signup.tsx`, `Reader.tsx`, `notifications.ts`, `learned.js`, `pair.js`, `ask.js`, lesson tools | `doPost row`, `PUB_ROW`, `joinWrite_`, `markJoined_` | `append_sheet_record`, `writeRow`, `markJoined`           | C, D, R                 |
| Admin rows and table replacement (`row`, `table`, `texts`), source-owned call-center tabs refused | `Admin.tsx`, management, lesson tools, studio                                                   | `appendCols_`, `writeTable_`, `YSH_TABS_`            | `writeRow`, `replace_sheet_table`                         | C, D                    |
| Private table reads (`read`, READ), roster pairs, station sync on read                            | management, jobs                                                                                | `doGet read`, `pairMap_`, `amdaSyncSoon_`            | `readLegacyTable`, `pairMap`, `stationSync`               | C, P                    |
| Rosters (`board`, READ or k), staff codes (`codes`, `newcode`)                                    | `Roster.tsx`, `orderRows`, `digest-send`                                                        | `boardData_`, `setCode_`                             | `databaseAction`, `setCode`                               | C, D                    |
| Team page (`team`, `teamlog`, TEAM)                                                               | `team.ts`                                                                                       | `TEAM_VIEW_TAB`, `TEAM_LOG_TAB`                      | `databaseAction`                                          | D                       |
| Identity (`idFor`, `whoIs`, `amdaFor`, `arrived`)                                                 | `StudentHome.tsx`, `Signup.tsx`, `learned.js`                                                   | `rowOfId_`, `personKey_`, `amdaLearnedOf_`           | `databaseAction`, `arrived`                               | C, D                    |
| Progress check (`mark`)                                                                           | `learned.js`                                                                                    | `learnSlice_`                                        | `markProgress`                                            | C, P                    |
| Shared learning (`pair`, `pairok`, `pairSeen`, `pendingFor`)                                      | `pair.js`                                                                                       | `זוגות` lookups                                      | `pairConfirm`, `pairSeen`, `pendingFor`                   | C, P                    |
| Help requests (`help`, public) and `helpdone`, `conflictdone` (READ)                              | `trip.js`, management                                                                           | `appendCols_ תקועים`, cell edit                      | `help`, `markHandled`, coordinator push                   | C                       |
| Staff access (`acc` public, `accset` READ)                                                        | `accCheck`, management                                                                          | `accAsk_`, `upsertCols_`                             | `access`, `upsert`                                        | C                       |
| Registration (`register`), conflicts, quiz answers (`quiz`)                                       | management queue, lesson tools                                                                  | `markJoined_`, `ensureCode_`, `flagRegConflict_`     | `register`, `quiz`                                        | C                       |
| Contacts (`contactSave`, READ)                                                                    | call center                                                                                     | `contactSave_`                                       | `saveContact`, `contactCells`                             | C, P                    |
| Archive, restore, list, duplicate merge (`archive`, `unarchive`, `archived`, `dedupe`, READ)      | management                                                                                      | `archivePerson_`, `restorePerson_`, `mergePeople_`   | `archive`, `dedupe`                                       | C                       |
| Row deletion and clearing (`delrow`, `clear`, READ, GET or POST)                                  | management                                                                                      | `delRows_`, `clearTab_`                              | `deleteRows`                                              | C                       |
| Learning station (`amdakind`, READ) and learner matching                                          | management                                                                                      | `amdaKind_`, `amdaSync_`, `amdaUnlink_`              | `stationKind`, `planStationSync`                          | C, P                    |
| Notifications (`fire=say`, READ or k), `resend`, `sayDone` (READ)                                 | management, jobs                                                                                | `ghFire_`, `sayRow_`                                 | `queueNotificationRequest`, outbox, `report_notification` | N                       |
| Staff digest dispatch (`fire=digest`, READ)                                                       | management                                                                                      | `repository_dispatch push-digest`                    | same dispatch from Vercel with `GH_TOKEN`                 | manual                  |
| Media publishing (`ghput`, `ghdel`, READ)                                                         | management, lesson tools                                                                        | `ghPut_`, `ghDel_`                                   | `github-publisher.ts`                                     | `github-publisher`      |
| Connection check (no parameters)                                                                  | management settings                                                                             | status object                                        | `health`, version 55                                      | C                       |
| Counter rebuild (`recount`), clock (`setup`)                                                      | management                                                                                      | `recount_`, triggers                                 | live views, GitHub cron (acknowledged)                    | C                       |
| Entry analytics (`funnel`, `trails`, `hit`, `trail`)                                              | management (reads only)                                                                         | separate Drive workbook                              | empty reports, writes ignored                             | P                       |
| Scheduled jobs (`read`, `board`, `sayDone`, `row`)                                                | `tools/*-send.mts`                                                                              | doGet, doPost                                        | `operational-store.ts`                                    | N                       |

Decisions:

- `pairFor` has no caller in this application and is not served on Neon. Custom `ss` workbooks and a custom server URL in management settings are unsupported after cutover; such requests fail instead of writing elsewhere.
- Apps Script time triggers: hourly `autoRecount` is obsolete because counters are live views. The 30-minute `clockTick` is replaced by the existing GitHub schedule in `digest-send.yml`. `backupDaily_` is replaced by Neon point-in-time restore on the production branch. The Taanit and Megila week shifts and `moveOutOfPublic_` were one-time source repairs that already ran.
- The rewritten join flow sends no entry analytics, so `funnel` and `trails` return empty reports on Neon. Their history remains in the original Drive workbook.
- After cutover, notifications require direct delivery (`HADAF_NOTIFICATION_DELIVERY=direct`) because Apps Script no longer dispatches them. Coordinator alerts for help and access requests use the same outbox.
- Legacy uploads through the API are limited by the 4.5 MB Vercel request body, so base64 media must stay under about 3.2 MB.

## Production cutover

`tools/cutover.mts` is idempotent and runs from `.github/workflows/database-cutover.yml` after each successful Vercel deployment to the `Production` environment, or manually with a dry-run checkbox. It does nothing unless the repository variable `HADAF_DATABASE_BACKEND` is `auto`.

1. If the production marker is already `active`, it applies pending runtime migrations and stops.
2. If the target holds an import without a marker, it refuses; such a database was imported by hand and needs review.
3. Otherwise it pauses writes by setting the marker to `frozen` for at most 20 minutes, waits 90 seconds for in-flight requests and the 15-second runtime marker cache, then captures the Sheets workbooks read-only through the Sheets API until two consecutive captures are identical.
4. One transaction imports the snapshot, applies every runtime migration, verifies every table's row count plus people, aliases and progress, checks that the freeze is still valid and sets the marker to `active`. Any failure rolls back everything and releases the freeze, so Sheets stays authoritative.

The runtime reads the marker only when `HADAF_DATABASE_BACKEND=auto`: no marker or an expired freeze keeps Apps Script; `frozen` keeps Apps Script reads and refuses writes with HTTP 503; `active` switches to Neon and is cached for the life of the instance. A failed marker read fails the request rather than risk writing to the retired source. `HADAF_DATABASE_BACKEND=neon` still forces Neon for previews. The write freeze was chosen over a final delta sync because most source writes update rows in place (signups, access, confirmations), which an append-only delta cannot reproduce. Clients keep drafts and queued rows when a write fails, so they retry after the switch. The freeze covers every write that passes through Vercel and the scheduled jobs; Apps Script's own counter trigger writes only derived counters, which Neon recomputes.

Logs contain counts, migration names and the source hash only.

## Owner configuration

Names only; never place values in Git, issues or chat.

Vercel project, Production environment:

- `DATABASE_URL`: pooled URL of a new, empty production Neon branch or database (not the candidate snapshot).
- `HADAF_DATABASE_BACKEND`: `auto`.
- `READ_KEY`, `TEAM_KEY`: the existing backend keys.
- `HADAF_NOTIFICATION_DELIVERY`: `direct`, with `VAPID_PRIVATE`.
- `GH_TOKEN`, `GH_REPO`, `GH_BRANCH`: repository publishing and the staff digest dispatch.

GitHub repository, Settings, Secrets and variables, Actions:

- Secrets: `DATABASE_URL` (same production URL), `CLASPRC_JSON`, `READ_KEY`, `VAPID_PRIVATE`.
- Variables: `HADAF_DATABASE_BACKEND` = `auto`, `HADAF_NOTIFICATION_DELIVERY` = `direct`.

Recommended order: set the GitHub values, run "Database cutover" manually with dry run checked to confirm the source counts, set the Vercel values, then deploy to production. The deployment triggers the cutover. Keep Neon point-in-time restore enabled on the production branch.

## Rollback

Before activation nothing changes: a failed run releases the freeze and Apps Script remains authoritative. After activation, writes land only in Neon. To roll back, set `HADAF_DATABASE_BACKEND` to empty in Vercel and Actions and redeploy, which returns traffic to Apps Script immediately; then reconcile Neon writes made since `cutover_state.activated_at` into Sheets before relying on them. To retry a cutover from scratch, point `DATABASE_URL` at a new empty branch; the tool never deletes an imported database.

## Verification

`tests/database-cutover.test.mjs` runs against an empty throwaway branch with synthetic data only:

```bash
DATABASE_CUTOVER_TEST_URL=THROWAWAY_BRANCH_URL node --test tests/database-cutover.test.mjs
```

Replace `THROWAWAY_BRANCH_URL` with a new empty branch's URL; the test refuses a non-empty target. It covers the dry run, an expired freeze that rolls back cleanly, activation, a repeat run that only migrates, marker-driven runtime selection and every legacy capability above.

## Preview setup

The account running this work cannot access the `ahiasaf` Vercel project. To try Neon on the protected branch preview, the owner adds, for **Preview only** and restricted to `feat/astro-performance-redesign`: the candidate branch's pooled `DATABASE_URL` (`source-snapshot-20261009`, not the empty default branch), the real `READ_KEY` and `TEAM_KEY`, and `HADAF_DATABASE_BACKEND=neon`. Then redeploy the preview and keep deployment protection on. Preview writes go to the candidate copy only and never reach production. The database resource is `hadaf-hashvui-preview` in Frankfurt; its owner can retrieve the pooled connection privately from [the existing integration resource](https://vercel.com/d/dashboard/integrations/neon/icfg_KXmfTV6pWODYw5MtFWhi56QP/resources/store_UAW5p2abOKB6UYH0). Production never uses this older snapshot; the cutover takes a fresh one.

## Performance evidence

A local Fedora client querying Frankfurt measured warm uncached public counters at 69-71 ms and process-cache hits at 0.02-0.03 ms. The authenticated 276-student roster measured 205-515 ms on repeated reads after batching its independent queries. Its first sampled read took 2.1 seconds. These are local backend samples, not browser load times, Vercel measurements or a cold-start guarantee. The free Neon compute can suspend. Cold starts and authenticated deployed APIs still need owner-assisted verification.

## Typed notification jobs

Manual delivery, staff digests, coordinator reminders and shared-learning jobs now run on Node 24 TypeScript. They use the configured source: Apps Script until the cutover marker is active (or `HADAF_DATABASE_BACKEND=neon` is set for previews). Migration `004-notification-ledger.sql` adds transactional delivery claims, retryable confirmed failures and monotonic report updates. Uncertain delivery acknowledgements stay pending and require investigation before retry.

For preview verification, the owner can set the Actions secret `NEON_PREVIEW_DATABASE_URL` to the imported candidate branch, select `neon-preview`, and keep the dry-run checkbox enabled. The workflow rejects live preview delivery. Dry jobs do not write reports, ledger entries or send notifications. Public logs contain counts only. Production uses `DATABASE_URL` and the repository variable `HADAF_DATABASE_BACKEND`; see owner configuration above.

Local verification confirmed one winning claim across eight concurrent workers on synthetic data, retries after acknowledged failure, pending-delivery blocking and late-report protection. Read-only dry targeting against the candidate snapshot selected 310 subscriptions and 13 staff digests. Raw source parity stayed at 37 tables and 7,663 rows. These are eligibility counts, not delivery proof. First manual-send failures now queue a single coordinator alert; system alerts cannot create alert loops. Live delivery still needs owner configuration and authenticated verification.

## Immediate delivery and duplicate protection

Migration `005-notification-outbox.sql` stores each manual request, its report and recipient deliveries in one transaction. Repeated submissions reuse a request identity. Atomic worker claims prevent two invocations sending the same delivery. Delivery begins in the API invocation with Vercel `waitUntil`, without waiting for GitHub or the scheduled clock. The background worker has a bounded time budget, and the existing scheduled workflow recovers confirmed failed deliveries with at most three attempts. Missing network acknowledgements remain uncertain and never automatically resend. Provider acknowledgement still does not prove device display or human viewing.

For production, the owner must provide `VAPID_PRIVATE` to the Vercel server and set `HADAF_NOTIFICATION_DELIVERY=direct` in Vercel and Actions variables. These remain server secrets. Do not enable direct delivery on preview data with real subscriptions. Immediate parent targeting uses scoped child relationships, progress segments and device aliases. Pair writes create durable events and wake the API worker after the save. Pair delivery shares its semantic key with the scheduled fallback and keeps the existing Shabbat window. Live device delivery remains a cutover gate; the coordinator failure-alert event is now durable and deduplicated. Current production has not been switched, and no real notifications were sent during verification.

The typed repository publisher uses `GH_TOKEN`, `GH_REPO` and an explicit `GH_BRANCH`. Configure the rewrite branch for preview. It permits only existing slide/audio upload paths and uses the observed file SHA. A failed lookup cannot become a create request, and a conflict requires reload rather than an overwrite retry. [GitHub Contents API](https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28) documents the SHA contract. [Vercel background work](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#waituntil) remains bounded by the function timeout.

When running integration files against one fixture branch, use `node --test --test-concurrency=1 tests/database-runtime.test.mjs tests/notification-ledger.test.mjs tests/notification-outbox.test.mjs tests/pair-notification-event.test.mjs` with `DATABASE_TEST_URL`. Files share a synthetic database, while each delivery test separately exercises overlapping workers. Never point these tests at the candidate or production branch.
