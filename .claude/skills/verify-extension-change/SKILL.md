---
name: verify-extension-change
description: Prove a Shortkeys change actually works in a browser before reporting it done — unit tests, build, visual review, then a real-Chrome check that the behaviour fires. Use after any edit under src/, and whenever a change touches the popup, the options page, a content script, or an action handler. Also use when asked to verify, check, or confirm that an extension change works.
---

# Verify a Shortkeys change

A browser extension is the place where green unit tests lie most. Vitest can
prove `buildPaletteEntries()` returns the right array. It cannot prove that a
palette row dispatches, that a keybinding fires in a live page, or that the
content script ever reached the DOM.

`CLAUDE.md` says a change is done when tests pass, the build passes, the
screenshots were inspected, **and the user confirmed it in `npm run dev`**. That
last step is manual and slow. This skill closes most of the gap before you hand
the work back: it proves the behaviour in the same Chrome a user runs.

## The loop

Run all four. Stop at the first failure and report it — do not continue and
summarize at the end.

### 1. Unit tests

```bash
npm test
```

Report the count, not the word "green": `850 passed (850)`, 31 files. A count
that *dropped* means you deleted coverage. A count that did not move after you
added a test means your test file is not being collected.

### 2. Build

```bash
npm run build
```

WXT type-checks the whole extension here. A Vue template referencing a property
you removed fails at this step, not in Vitest.

### 3. Visual review — UI changes only

```bash
npm run visual-review
```

Then **read the PNGs** in `screenshots/` with the Read tool. Do not claim you
inspected them if you did not open them.

If the script does not capture the state you changed, the review proves nothing.
Add a capture to `scripts/visual-review.ts` — this is expected, not scope creep.
A new state needs a new capture.

### 4. Real-browser check — behaviour changes

Unit tests and screenshots both stop short of "does it actually run". Write a
short check with the harness in this skill:

```bash
npx tsx .claude/skills/verify-extension-change/scripts/my-check.ts
```

`scripts/with-extension.ts` builds the extension, launches Chrome with it
loaded, waits for the service worker, closes the install tabs, and hands you the
context plus `popupUrl` and `optionsUrl`. A useful check is about 15 lines.

`scripts/palette-runs-unassigned-action.ts` is a worked example from issue #975:
it opens three tabs, searches the palette for an action with no keybinding,
presses Enter, and counts the tabs that survive.

Assert on an **effect** — a tab closed, a value stored, a class applied. Never
on "the row rendered". Rendering is what step 3 already covers.

## Rules for this repo

- Run from the repo root. The scripts resolve `@playwright/test` from the
  repo's `node_modules`; they fail outside the tree.
- The repo is CommonJS. No top-level `await` — wrap the check in `main()`.
- Always let the harness build (`build: true`, the default). A stale
  `.output/chrome-mv3` silently verifies the previous version of your code.
- `screenshots/` is gitignored. Attach a PNG to the report; do not commit it.

## What this cannot prove

Say so out loud rather than overclaiming:

- **Which tab is "current".** In the harness the popup loads as its own tab, so
  the background script treats *it* as the active tab. Anything shaped like
  "act on the current tab, except…" still needs `npm run dev`.
- **Firefox.** The harness loads `.output/chrome-mv3`. MV2 behaviour is
  unverified.
- **The real browser-action popup.** It is an overlay in real use, and a page
  here. Focus and lifecycle differ.

## Reporting

Hand back: the diff, the test count, the build result, the screenshots you
opened, and the check output pasted verbatim. Then state plainly what is still
unproven, and ask the user to run `npm run dev`.

Do not commit. `CLAUDE.md` never-ever rule 3.
