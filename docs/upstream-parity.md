# Main features adapted to the rewrite

Source snapshot: `2d63629` (main, 8.99.219), compared with the rewrite's original base `adb7738`. Main remains separate. These changes adapt its behavior to Astro routes and the same-origin API rather than merging its old application.

- Staff access: approval follows the device and school, pending requests refresh when returning to the page, and locked devices lose cached roster data. Coordinators can approve or lock requests in the redesigned admin workspace. Shared school codes alone do not authorize roster access.
- Classroom tools: the detailed roster is available at `/board-tools` and inside management. Approved staff can read school-scoped seventh and eighth grade names and record attendance. Phone columns are excluded from network-roster responses.
- Network import: recognizes the newer Ministry school names and location aliases, displays school location, and explains schools excluded because they have no seventh or eighth grade students.
- Learning: unit changes reuse the lesson screen, completion leads to the weekly quiz or its opening reminder, and parent participation uses the existing pair workflow. Reminder requests show success only after server acknowledgement.
- Editing: week cutoffs, cross-page continuation merging, retained drafts, autosave recovery, published deck covers, deleted-slide anchor cleanup, and stable ID migration/restore are included. Neon compares the saved base and uses transactions for maintenance changes.
- Signup: student phone numbers are optional, parent and recovery phone numbers remain required, and locked staff can move to student signup with their details prefilled. Parent invitations retain their read-only message and wait for a successful save before opening WhatsApp.
- Content: newer slide assets, a video opened from the homepage logo, updated editable copy, and institution-preserving staff installation URLs are included. The video does not download before user intent. Retired slides stay in source history but are excluded from served assets.
- Jobs: the existing manual tools workflow includes stable ID and slide-anchor maintenance. These use the authoritative backend switch. Clock status reports actual job records and configured scheduling rather than claiming an Apps Script trigger exists on Neon.

Desktop styling is restricted to widths above 900px. Seven phone screenshots were pixel-identical before and after that styling change. The feature backport retains the rewrite's phone layout and guided forms, while adding the newer functional states.

## Verification boundaries

Unit tests cover school grants, roster projection, attendance scope, stable ID validation, published cover paths, and transactional handler behavior with a mocked database. Browser checks cover approved/pending/locked access, admin save failure and retry, video focus, detailed-board embedding, signup, lesson controls, reminder acknowledgement, and existing order/community workflows. Database integration tests still require a configured test database.

The checked Vercel alias is `https://hadaf-rewrite-check.vercel.app`. The shared Apps Script deployment and real notification jobs were not invoked by this backport. Backend source is updated for parity; deploying that shared script or activating production cutover remains a separate release action.
