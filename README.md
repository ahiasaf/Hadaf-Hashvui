# Hadaf Hashvui

A Hebrew learning PWA for the Bnei Akiva weekly Gemara program. Astro prerenders the public pages and calendar. Focused React screens handle learning, signup, staff and administration; specialist editing tools load on demand. The homepage needs no React runtime.

## Run

Use Node.js 24 (minimum 22.12).

```bash
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:4321`. This serves clean URLs and the same API handlers as deployment. `npm run dev` runs the Astro pages only.

## Verify

```bash
npm run check
npm run lint
npm run format:check
npm test
npm run test:browser
python3 tools/preflight.py
```

Build before running tests. Browser checks use bundled public-content fixtures and mocked writes, so they do not modify production data.

## Content and deployment

`src/config/program.js` remains the content source, including editable UI copy. Google Sheets provides published overrides; private rows and credentials remain in the existing Apps Script backend. Same-origin public reads are deduplicated, cached briefly, and bounded by timeouts.

Vercel builds `dist/` and deploys branch previews. `/api/sheets` exposes only approved public tabs; `/api/wait` returns success only after the existing backend acknowledges a notification request. Repository secrets remain server-side; this frontend migration does not deploy the shared Apps Script backend.

See [architecture](docs/architecture.md) and [acceptance checklist](docs/migration-checklist.md). `/admin` remains a direct-entry tool. `/tyuta` retains local draft recovery.
