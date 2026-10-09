# Architecture

## Source layout

- `src/pages`, `src/components`, `src/layouts`, `src/styles`: Astro public pages and focused React interactions.
- `src/lib`: typed calendar, CSV, lesson parsing, notifications and browser data access.
- `src/server`, `api`: same-origin public reads and authenticated or acknowledged private actions.
- `src/config`, `src/shared`: maintained program configuration and classic scripts required by operational tools.
- `src/features`: specialist views, styles and ordered script units, rendered as Astro routes.
- `static`: original learning images, fonts, manifests and other public content.
- `slides`, `audio` (when recordings exist): publisher-managed source assets. Existing Apps Script uploads and GitHub Contents verification require these root paths. Preparation mirrors them into ignored `static` folders, preserving public URLs and including future uploads in each build.
- `backend`: shared Apps Script implementation, preserving the latest main-branch private call-center routing update.
- `tools`, `tests`: build, maintenance and verification.
- `src/generated`, `dist`, `.astro`, `.vercel`: ignored generated output.

The former monolithic root HTML documents are removed. Public learning, registration, staff, roster and admin screens use TypeScript and React. Specialist business logic is retained in separate source units, including authored audio, quizzes, slides, recording and editing at `/lesson-tools`. Those tools load only when opened.

## Rendering and layout

Public documents and the calendar are prerendered. The homepage uses native browser behavior, with no React runtime. It refreshes the current week using the Jerusalem calendar. Saved institution names stay visible when the public spreadsheet is unavailable or has an unexpected schema.

The centered canvas uses Hebrew RTL and logical spacing. Text, forms and lists align to their reading direction. Primary lesson actions and completion states are centered. Sections share a background and dividers instead of nested cards. Responsive library images retain the original full-resolution scans for zooming. Normal view always requests the 800px scan, so high-density phone screens cannot silently download the full-resolution version. A nearby next page is prefetched at low priority unless data saver or a slow mobile connection is detected. Library metadata is a separate compact fingerprinted JSON asset, cached across lessons rather than repeated in every page. Book thumbnails and display images use smaller fingerprinted variants; offscreen specialist images load lazily.

Old institution links route to `/tzevet`. The old admin hash and other operational hashes route to `/management`, preserving their query, hash and local PIN entry. `/admin` is the focused server-authenticated participant and content screen; its private read key is separate from the local management PIN. Clean URLs and `.html` routes remain available.

## Caching and data

Fingerprint-named Astro assets and generated media have a one-year immutable cache. Editable original content uses a shorter cache with background revalidation. The service worker precaches only the homepage and its actual module dependencies, and caches visited public assets. API requests bypass it entirely.

Typed public reads share in-flight requests and retain successful results in session storage across navigation. Lesson content and copy expire after five minutes; opening dates and counters after 30 seconds. The CDN uses corresponding short public windows. Explicit refresh bypasses caches. Successful edits invalidate local public results and bypass the CDN for subsequent verification. Private roster responses, credentials and account reads never enter public caches.

The public proxy accepts only approved table names, never arbitrary spreadsheet IDs or keys. It rejects login HTML, unexpected schemas and private contact columns. Missing data and network failures remain distinct. Lesson marks are filtered to the chosen daf and its continuation before parsing, with stable segment identities.

Private actions use POST and `no-store`; Apps Script retains its existing authorization checks. Supported management reads use the same-origin private endpoint and deduplicate only while in flight, without retaining private responses. Custom legacy endpoints and other operational calls preserve their existing routing. Signup, progress, admin edits and notification requests require an explicit success acknowledgement. Failed edits retain the draft. Restored accounts recover server progress; the student screen reconciles merged IDs and station completions while keeping local progress available offline.

## Deployment and content boundaries

This branch deploys a frontend preview, without merging main or redeploying the shared Apps Script backend. No private deployment secrets are bundled in browser props or generated output. The isolated local demo uses fixtures and in-memory writes, never production writes.

Megila ends on 32a, matching its one-page terminal source. Taanit 31 has no source URL in the original content. A real publisher source is required to fill that gap. Existing library originals are retained, while obsolete voice/push experiment pages and generated research output are removed.
