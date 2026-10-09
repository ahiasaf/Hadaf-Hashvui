# PostgreSQL migration

The selected database is hosted Neon PostgreSQL, not a service on a personal machine. A separate free preview resource, `hadaf-hashvui-preview`, was provisioned in Frankfurt through the existing Vercel integration. Production Sheets and Apps Script remain authoritative until the full workflow cutover is verified.

The preview schema preserves every exported table, header, row order and metadata. Indexed people, device aliases and progress events provide relational queries without scanning whole sheets. The progress view joins merged device IDs, takes the maximum partial progress, and lets completion override earlier partial events. Unregistered device events are retained. Ambiguous aliases, invalid progress identities and missing required columns stop import.

## Import

Use a private JSON export with `version: 1`, an ISO `capturedAt`, and `tables: [{name, rows, metadata}]`. Each table's first row contains its headers. Include `לומדים` and `לימוד`. Keep real exports outside Git and restrict local file permissions. Never log row contents or database credentials.

```bash
rtk proxy node tools/import-database.mts /PRIVATE_PATH/snapshot.json
rtk proxy node --env-file=.env.neon-preview tools/import-database.mts /PRIVATE_PATH/snapshot.json --apply
```

The first command validates and reports counts only. The second requires a server-only `DATABASE_URL`, creates the schema and imports atomically. It refuses a previously imported target; use a separate database branch for another candidate. No existing source data is deleted. Verify table counts, canonical identities, parent relationships and complete/partial progress against the source before switching reads.

## Cutover gates

- The `ahiasaf` Vercel owner must connect the verified database branch to the project preview environment. Our account cannot configure that project.
- Export a consistent read-only snapshot, including staff, orders, content, notifications and private operational tables. Some legacy read endpoints trigger writes; do not use those endpoints for a supposedly read-only export.
- Migrate the remaining specialist operations and scheduled notification jobs, including write acknowledgements and authorization. Validate every capability, not only roster queries.
- Compare PostgreSQL and Sheets results, including alias and parent matching, then run a bounded final synchronization and switch the authoritative backend once. Avoid unsynchronized dual writes.
- Keep the source snapshot and existing backend available for rollback. Remove the old backend only after cutover and runtime verification.

The free database can suspend while idle. Measure cold and warm queries separately. A paid always-active compute is an optional later decision, not enabled by this migration. The branch configuration selects `fra1` for API functions, matching Neon Frankfurt, to avoid a cross-region database hop. This setting is supported by [Vercel function-region configuration](https://vercel.com/docs/functions/configuring-functions/region). Verify the deployed region after the owner connects it.

## Verified source import

The signed-in Firefox session supplied two identical captures of all 37 public and private tabs. The isolated `source-snapshot-20261009` Neon branch contains 7,663 source rows, 451 canonical people, 455 device aliases and 1,254 progress events. A cell-by-cell comparison verified every raw row and normalized record after the runtime migrations. The source remained read-only throughout. The default preview branch is still empty. This is a verified migration candidate, not the live production authority.

The synthetic `fixtures` branch separately verifies signup, device merging, parent matching, partial and completed progress, write acknowledgements, authorization, rollback on invalid progress, and team logging. Real participant rows are never used by browser tests or the public demo.

Run versioned runtime migrations on an existing imported candidate:

```bash
rtk proxy node tools/migrate-database.mts
rtk proxy node --env-file=.env.neon-preview tools/migrate-database.mts --apply
```

The dry run reports migration names and statement counts. Applying records checksums, takes a transaction lock, and commits all pending schema changes atomically. Editing an already applied migration is rejected. New imports apply the runtime schema in the import transaction.

## Current runtime coverage

Neon supports public content reads, live derived registration and completion counters, signup, device aliases, restored identity, progress, authenticated rosters, private table reads and replacements, staff codes, team reads and logs, and notification subscriptions. Public counters expose only counts and grouping labels. Private roster queries batch progress, relationships and notification state instead of making one query per participant. Private responses remain uncached.

The remaining specialist management actions, media publishing and scheduled notification jobs still use Apps Script. Do not enable a full cutover yet. An explicit `HADAF_DATABASE_BACKEND=neon` selects Neon; providing `DATABASE_URL` alone keeps the existing backend active. Unsupported Neon actions fail explicitly rather than silently writing to a second database.

## Owner setup, safe to do now

The account running this work cannot access the `ahiasaf` Vercel project. The project owner can prepare the connection without granting account access:

1. Open the existing `hadaf-hashvui` Vercel project's Settings, Environment Variables.
2. Add the candidate branch's pooled `DATABASE_URL` for **Preview only**, restricted to `feat/astro-performance-redesign`. Obtain its value privately from the Neon resource owner, selecting `source-snapshot-20261009`, not the empty default branch. Never send it in Git, screenshots, issue comments or public chat.
3. Add the existing server-only `READ_KEY` and `TEAM_KEY` for that same preview scope. Use the real backend keys. The local management PIN is not a read credential.
4. Leave `HADAF_DATABASE_BACKEND` unset while the remaining workflows are migrated. Production variables and the main deployment stay unchanged.
5. Redeploy this branch preview after the variables are saved. Keep Vercel deployment protection enabled for participant data.

The database resource is `hadaf-hashvui-preview` in Frankfurt. Its resource owner can retrieve the pooled connection privately from [the existing integration resource](https://vercel.com/d/dashboard/integrations/neon/icfg_KXmfTV6pWODYw5MtFWhi56QP/resources/store_UAW5p2abOKB6UYH0). Connecting through the environment variable does not require installing that owner's integration into the `ahiasaf` team.

After every operational capability passes, take a fresh consistent source snapshot, import a new candidate, compare again, and pause source writes for the final transition. Enable Neon in the protected branch preview first, verify real authenticated reads and synthetic writes, then let the project owner perform the production cutover. Do not switch production from this older snapshot or accept unsynchronized dual writes. Rollback after new Neon writes requires reconciling those writes before returning to Sheets.

## Performance evidence

A local Fedora client querying Frankfurt measured warm uncached public counters at 69-71 ms and process-cache hits at 0.02-0.03 ms. The authenticated 276-student roster measured 205-515 ms on repeated reads after batching its independent queries. Its first sampled read took 2.1 seconds. These are local backend samples, not browser load times, Vercel measurements or a cold-start guarantee. The free Neon compute can suspend. Cold starts and authenticated deployed APIs still need owner-assisted verification.

## Typed notification jobs

Manual delivery, staff digests, coordinator reminders and shared-learning jobs now run on Node 24 TypeScript. They use the configured source, which remains Apps Script until `HADAF_DATABASE_BACKEND=neon` is explicitly set. Migration `004-notification-ledger.sql` adds transactional delivery claims, retryable confirmed failures and monotonic report updates. Uncertain delivery acknowledgements stay pending and require investigation before retry.

For preview verification, the owner can set the Actions secret `NEON_PREVIEW_DATABASE_URL` to the imported candidate branch, select `neon-preview`, and keep the dry-run checkbox enabled. The workflow rejects live preview delivery. Dry jobs do not write reports, ledger entries or send notifications. Public logs contain counts only. Production uses `DATABASE_URL` and the repository variable `HADAF_DATABASE_BACKEND`; leave that variable unset until the remaining management, dispatch and publishing migration is verified.

Local verification confirmed one winning claim across eight concurrent workers on synthetic data, retries after acknowledged failure, pending-delivery blocking and late-report protection. Read-only dry targeting against the candidate snapshot selected 310 subscriptions and 13 staff digests. Raw source parity stayed at 37 tables and 7,663 rows. These are eligibility counts, not delivery proof. The legacy coordinator failure-alert trigger is not yet reproduced by Neon report updates and remains a cutover gate.
