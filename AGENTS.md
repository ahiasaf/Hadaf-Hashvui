<!-- Generated from agent-toolkit instructions/project.md. Refresh with:
     python3 scripts/toolkit.py project --dir <repo> --apply --force -->

# Project agent instructions

Behavioral guidelines to reduce common LLM coding mistakes. Append this repository's build commands, test commands, and domain notes after these shared rules.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## Automatic vs human checks

This line is absolute. Fully automatic, never ask: reading files and command output, searching code, running tests, linters, builds, and checks, showing previews, diffs, and plans, and editing files in the working tree, committing task changes, and pushing them directly to main after required checks pass. This is standing authorization for commits and pushes; do not request approval for them.

Human check required, always stop and ask first (a standing user instruction counts as the check): deleting anything (files, branches, data), merging, deploying, publishing, or releasing; sending messages, pings, or notifications; touching credentials, billing, access, or production data; any other irreversible or externally visible action except the commits and pushes authorized above. A green run on your machine is not approval to deploy, publish, or release.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only mess in the project.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

# Behavior Guidelines
- Auto-approve all read-only operations.
- Minimal verbal output (Caveman style).
- Do not ask for confirmation for `git status` or `ls`.
- Commits and pushes to `main` are automatic after checks pass. Ask only for actions requiring a human check above.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# Personal Development Preferences

## Quality bar

Ship everything optimized: fast, accurate, and responsive. Prefer the efficient approach (fewer calls, less output, no redundant work) without cutting correctness. Everything visible must look and feel professional: clean custom-themed components, purposeful animations, lively feedback for every state (loading, progress, success, error), consistent with the product's visual theme. Aim for Apple-like polish: restrained, precise, delightful. No slop, no dead controls, no frozen screens.

## Code and directory hygiene

Write clean, readable code: consistent naming, small focused units, no dead code left behind. Always run the repository's formatter and linter before finishing (or the language default when the repo defines none). Keep the file tree tidy: no stray files, no scratch dumps in the repo root, build artifacts ignored, one clear place per kind of file.

## Web and UI

- For websites, HTML, and other UI work, prefer custom-themed components and sleek, interactive animations over generic or unstyled interfaces.
- Keep animation purposeful, responsive, accessible, and consistent with the product's visual theme.

## Java and Kotlin

- Put the `package` declaration at the top of each source file, followed by imports.
- Import classes and use their short names in implementation code. Do not write fully qualified class names inline when a normal import is possible.

Preferred:

```java
package com.example.app;

import com.example.classes.SomeClass;

class TestSmth {
    void run(String testString) {
        SomeClass.function(testString);
    }
}
```

Avoid:

```java
class TestSmth {
    void run(String testString) {
        com.example.classes.SomeClass.function(testString);
    }
}
```

## Language and examples

Always answer the user in English. Preserve original names, quoted source text, and product localization when relevant. Use fenced code blocks with a language tag for commands, configuration, and multiline examples. Use clear uppercase example values such as MACHINE_USER rather than angle-bracket placeholders; explain what to substitute. Never use em dashes or en dashes in output or edited files; use commas, colons, parentheses, or plain hyphens instead.

## Commit identity

Commit using the authenticated human GitHub account and its GitHub-provided noreply email. Inspect `gh api user` and existing repository identity before changing local Git configuration. Prefer repository-local settings; do not alter another author's history. Never append Claude, GPT, Codex, or other AI coauthor/contributor trailers or generated-by signatures. Verify author and committer before publishing. Keep the actual human author attribution accurate.

## Starting work in a repository

At the start of every session, in every repository including old ones, check for dead branches and open pull requests before writing code:

```bash
agent-toolkit repo-health --dir .
```

Surface what it reports: delete only branches already merged into main after a glance; queue green and approved pull requests for the human to merge, and rework or close the rest. Never let stale branches pile up unexamined.

## Git and GitHub workflow

Use git and gh together: git for local history, gh for everything on GitHub. Always commit and push task changes directly to `main` after required checks pass, without asking for approval. Do not create feature branches or pull requests unless the user explicitly requests them. Keep commits focused and preserve unrelated edits.

```bash
git status --short --branch
git fetch origin
git switch main
git pull --ff-only origin main
git add -p
git commit -m "fix: describe the change"
git push origin main
gh run list --branch main --commit COMMIT_SHA
gh run watch RUN_ID --exit-status
```

Replace `COMMIT_SHA` and `RUN_ID` with the actual commit and its workflow run. The default branch is `main`, not `master`. Never force-push or overwrite another author's work. Verify the remote SHA and CI for the exact commit; report missing CI or failed checks accurately. A push alone does not prove deployment or served behavior.

## Software and libraries

Use the best library for the task based on correctness, maintenance, performance, documentation, licensing, and fit with the project. New software and modern code are welcome when they solve a concrete need; unfamiliarity alone is not a reason to reject them. Verify current official documentation before adopting an unfamiliar dependency. Explain material tradeoffs. Prefer standard-library solutions when they fully meet the need, and avoid extra dependencies or rewrites solely for novelty.

## Publishing repositories

When a repository is published or updated on GitHub, fill the About sidebar so the repo home page shows it: a short description, the website URL, topics (hashtags), and anything else relevant such as releases or a social preview image.

```bash
gh repo edit OWNER/REPO -d "Short description" -h "https://example.com" --add-topic topic1 --add-topic topic2
gh repo view OWNER/REPO --json description,homepageUrl,repositoryTopics
```

Verify with `gh repo view` that description, homepage URL, and topics are set and visible.

## README

Keep every repository README short and very explanatory: what the project is in one or two sentences, how to install and run it, how to verify changes, and links to deeper docs. Cut everything else. A README that takes a minute to read beats a complete one nobody finishes.
