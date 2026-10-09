# UI and performance review

The no-ones-ui-review findings and approved fixes:

| Finding                                                        | Result                                                                                                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Failed reads looked like missing content                       | Separate error, retry, locked and missing states; failed responses are never cached as empty data.                                                            |
| Notification and signup success could precede a confirmed save | Focused screens require an upstream acknowledgement, retain failed drafts and support retry.                                                                  |
| Public pages loaded monolithic admin code                      | Astro prerenders 25 routes. The homepage has no React island and specialist tools load only when opened.                                                      |
| Small targets and unstable option changes                      | At least 44px primary touch controls, unchanged tab and busy-button widths, shared-grid track crossfade and bounded keyboard-accessible explanations.         |
| Repeated titles, crowded cards and inconsistent RTL            | Flat blue/gold sections, compact centered intros and primary actions, natural RTL forms/prose, concise Hebrew and directional SVG chevrons only where useful. |
| Large media and stale defaults                                 | 119 smaller scan previews, original zoom assets preserved, 66 fingerprinted display assets and verified slide defaults.                                       |
| Root clutter and mixed source/generated files                  | Root reduced from 81 entries to 21 (excluding dependencies and generated output); source, content, backend, maintenance and tests have separate locations.    |

## Measured results

Homepage HTML is 15,725 bytes instead of 995,036 bytes (98.4% smaller). The reader HTML is 16,700 bytes; its reusable image manifest is a separately cached asset. The 119 normal-view scans total 43,430,496 bytes instead of 81,493,052 bytes (46.7% less); original full-resolution scans remain available. The largest slide preview drops from approximately 3.51 MB to 0.55 MB.

A local Chrome phone simulation (390px, DPR 3, 6 Mbps download, 80ms latency, 4x CPU slowdown) measured FCP 420ms, LCP 624ms and CLS 0 on the homepage. This is simulated local-preview evidence, not a production field measurement. Cold private roster reads still depend on Apps Script latency; private data is never shared through the CDN.

Claude Fable 5.1 performed visual refinement using mobile-ux, no-slop-frontend and the design-logic UX Peak reference. Independent browser verification covers 320, 360, 390, 768 and 1440px; normal and reduced motion screenshots cover phone and desktop. Track options preserve the main action position, reader explanations preserve the scan and action positions, and loading labels preserve button width. Public controls use native accessible semantics with custom visual treatment.

The focused public flows and library are rewritten in TypeScript/React. Specialist tools are replatformed as Astro routes while their operational JavaScript remains intact to preserve editing, ordering, reports, quizzes and audio. Existing backend behavior is preserved, including the latest private call-center update from main. No production data writes were used to validate this rewrite.

The genuine content gap remains Taanit 31: the existing program has no publisher source URL. The rewrite does not fabricate a substitute. See the [architecture](architecture.md) for caching and deployment boundaries.
