# Rewrite acceptance checklist

User scope: review findings 1-7, full website rewrite, Hebrew RTL, English implementation and commits, Astro/React prerendering, faster and accurate learning library, reduced database calls, source cleanup, new branch and verified deployment.

- [x] Review and measure the original site.
- [x] Use mobile-ux, no-slop-frontend and latest toolkit design-logic guidance.
- [x] Create an isolated feature branch and generated repository instructions.
- [x] Replace core public screens with Astro and typed React components.
- [x] Validate lesson segment IDs, ordering, continuation and page boundaries against existing data.
- [x] Add responsive library images, preserve original scans and validate every indexed page.
- [x] Deduplicate public reads, add deadlines, narrow shared caching and invalidate after writes.
- [x] Reject private schemas and require explicit write acknowledgements.
- [x] Separate source, assets, backend, tools and tests.
- [ ] Finish the full TypeScript rewrite. Six additional tool routes and the home scripts are now typed; management, studio, lesson tools and remaining operational jobs still need replacement. Superseded files are removed only after their replacement passes.
- [x] Verify signup, restored accounts, progress, locked lessons, notifications and admin behavior with isolated browser fixtures.
- [x] Verify phone/desktop screenshots, accessibility, offline behavior and prerendered fallback.
- [x] Pass formatting, lint, types, tests, preflight and build.
- [x] Commit and push the feature branch with accurate human identity.
- [x] Verify exact-commit GitHub CI and Vercel deployment status.
- [ ] Verify authenticated live routes/API after owner-assisted Vercel configuration. Account access cannot be granted. The existing Vercel preview protection returns 302/401 to anonymous requests; local built-site and isolated API behavior are verified.

Content gap: Taanit 31 has no source URL in the existing content. Do not substitute unrelated content or claim the missing source has been restored.

Claude Fable 5.1 refinement and final review of the initial UI pass completed. The later management rewrite reached its session quota before implementation; it is still unfinished. Phone/desktop normal and reduced-motion screenshots show stable track actions, reader scans and buttons. The long explanation region was verified with keyboard scrolling and visible focus. See [review results](review-results.md).

Latest UI acceptance: natural Hebrew copy, no em/en dashes, compact modern spacing and smooth flow. Changing lesson options must not move the main action; changed text fades without resizing its panel. Verify reduced motion and actual file/image transfer sizes.

Initial rewrite commit: `c68fde114b23977064bcdc36858d74136d956f75`. [GitHub checks](https://github.com/ahiasaf/Hadaf-Hashvui/actions/runs/37892286156) passed, including the browser matrix and 28 unit tests. [Vercel preview](https://hadaf-hashvui-k5aoghfit-ahiasaf.vercel.app) deployment status is successful for that exact commit.

GitHub About metadata could not be updated by the authenticated collaborator account: the repository edit endpoint returns HTTP 404. The existing production homepage URL is preserved; the README contains the project description and architecture links.

Concurrent upstream fixes are preserved: private call-center routing from `d553e4b` and institution-code validation from `ddbad48`. A regression check rejects lesson-sheet fallback while allowing a new institution beside known codes.

Publisher compatibility: slides and future audio uploads retain the root source paths used by the existing backend. The build stages them into ignored public folders. Regression checks cover new uploads, replacements and removal so generated mirrors cannot retain stale files. No live publishing or deletion was performed.

Neon source migration candidate: all 37 source tabs and 7,663 rows were imported into the isolated source snapshot branch and matched cell by cell. Signup, alias merging, progress, parent matching, rollback, derived public counters and team logs pass against synthetic Neon fixtures. A fresh fixture import also applies runtime migrations atomically and repeat migration is a no-op. Production authority remains Sheets. See [cutover coverage and owner steps](database-migration.md).
