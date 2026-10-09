# PostgreSQL migration

The selected database is hosted Neon PostgreSQL, not a service on a personal machine. A separate free preview resource, `hadaf-hashvui-preview`, was provisioned in Frankfurt through the existing Vercel integration. Production Sheets and Apps Script remain authoritative until the full workflow cutover is verified.

The preview schema preserves every exported table, header, row order and metadata. Indexed people, device aliases and progress events provide relational queries without scanning whole sheets. The progress view joins merged device IDs, takes the maximum partial progress, and lets completion override earlier partial events. Unregistered device events are retained. Ambiguous aliases, invalid progress identities and missing required columns stop import.

## Import

Use a private JSON export with `version: 1`, an ISO `capturedAt`, and `tables: [{name, rows, metadata}]`. Each table's first row contains its headers. Include `לומדים` and `לימוד`. Keep real exports outside Git and restrict local file permissions. Never log row contents or database credentials.

```bash
rtk proxy node tools/import-database.mjs /PRIVATE_PATH/snapshot.json
rtk proxy node --env-file=.env.neon-preview tools/import-database.mjs /PRIVATE_PATH/snapshot.json --apply
```

The first command validates and reports counts only. The second requires a server-only `DATABASE_URL`, creates the schema and imports atomically. It refuses a previously imported target; use a separate database branch for another candidate. No existing source data is deleted. Verify table counts, canonical identities, parent relationships and complete/partial progress against the source before switching reads.

## Cutover gates

- Obtain project access to `ahiasaf/hadaf-hashvui` and connect only its preview environment initially.
- Export a consistent read-only snapshot, including staff, orders, content, notifications and private operational tables. Some legacy read endpoints trigger writes; do not use those endpoints for a supposedly read-only export.
- Migrate the remaining specialist operations and scheduled notification jobs, including write acknowledgements and authorization. Validate every capability, not only roster queries.
- Compare PostgreSQL and Sheets results, including alias and parent matching, then run a bounded final synchronization and switch the authoritative backend once. Avoid unsynchronized dual writes.
- Keep the source snapshot and existing backend available for rollback. Remove the old backend only after cutover and runtime verification.

The free database can suspend while idle. Measure cold and warm queries separately. A paid always-active compute is an optional later decision, not enabled by this migration. Keep Vercel functions and the database in the same region when connecting them.

## Verified preview

The separate `fixtures` branch passed an atomic import using synthetic data only. Verification confirmed all four source rows were preserved, two device aliases mapped to one person, completed events superseded partial progress, unregistered progress remained available, and a second import into the same target was rejected. The default preview branch remains empty. This verifies the importer and PostgreSQL view, not a production cutover.
