# Shortkeys — agent guide

Shortkeys is a cross-browser extension that lets a user bind custom keyboard
shortcuts to browser actions. It ships to Chrome, Firefox, Edge and Opera and
has 200,000+ Chrome users. MIT licensed, currently v5.0.1.

**Read this before you touch anything.** The install base is large and the data
format is shared with v4, so a careless change silently breaks shortcuts that
real people rely on every day.

**Then read `memory-bank/`.** This file holds the rules. `memory-bank/` holds the
state — what is in flight, what is settled, what is known broken. Start with
`memory-bank/activeContext.md` and `memory-bank/progress.md`; they are updated at
the end of any session that changed code.

---

## The three never-ever rules

### 1. Never renumber or rename a published manifest command key

The keys in `commands` in `wxt.config.ts` (`01-newtab`, `44-top`, …) are stored
by the browser to remember the shortcut each user assigned. Renaming or
renumbering one silently reassigns or destroys that binding for every installed
user. **Append new keys only.** Never close a numbering gap, never re-sort the
list, never "tidy up" the duplicate `65-disable` … `70-disable` entries.

### 2. Never call `chrome.storage` directly from app code

All shortcut persistence goes through `saveKeys()` / `loadKeys()` in
`src/utils/storage.ts`. That module owns a contract you cannot reproduce by
hand: shortcuts are **chunked** across `keys_0`, `keys_1`, … with a `keys_meta`
entry holding the chunk count, because `storage.sync` caps a single item at
8,192 bytes; it falls back to `storage.local` when the payload exceeds the
100KB sync quota; and it still reads the legacy single `"keys"` entry for v4
data. A direct `browser.storage.*` call bypasses all of that and splits the
user's shortcuts across two stores.

### 3. Never push to `master`, and never commit a change the user has not tested

Work on a feature branch. After you implement a change, start `npm run dev` and
**wait for the user to confirm the change works in a real browser** before you
commit or push. Unit tests do not prove that a keyboard binding fires in a live
page. The user reviews and merges; you do not merge.

---

## Halt and ask first

These are not forbidden, but never do them on your own initiative:

- **Widening `permissions`, `optional_permissions`, `host_permissions`, or
  `externally_connectable`** in `wxt.config.ts`. Each addition triggers a store
  re-review and a scary permission prompt for existing users.
- **Opening a PR against `upstream`.** `origin` is `imvasen/shortkeys` (a fork);
  `upstream` is `crittermike/shortkeys`. `gh pr create` can default to upstream.
  Always pass the target explicitly and confirm which repo the PR is for.
- **Publishing** — store submission, version bumps, `npm run zip`.
- **Copying code from Vimium-C.** The Vim modules are clean-room
  reimplementations; see `NOTICE.md`. Copied source changes the licence story.

---

## Tech stack

| Layer      | Choice                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| Build      | WXT (Vite-based extension framework) — `wxt.config.ts`, `srcDir: 'src'` |
| Language   | TypeScript throughout                                                   |
| UI         | Vue 3, Composition API, `<script setup>`                                |
| Keys       | Mousetrap (content-script binding and `stopCallback`)                   |
| Editor     | CodeMirror 6 (custom JavaScript actions)                                |
| Unit tests | Vitest — `tests/**/*.test.ts`, `node` env, `@` aliases `src/`           |
| E2E        | Playwright — `e2e/`, serial (`workers: 1`), Chromium only               |
| Website    | Astro SSG in `site/`, deployed to Netlify (shortkeys.app)               |
| CI         | GitHub Actions on Node 22: tests + build, plus a separate E2E job       |

Chrome and Edge and Opera build MV3; **Firefox builds MV2** and lacks the
`debugger`, `userScripts` and `tabGroups` APIs. Guard every use with an
existence check.

## Commands

```bash
npm run dev             # Chrome dev mode, hot reload
npm run dev:firefox     # Firefox dev mode
npm test                # Vitest — 840 tests, 30 files
npm run test:watch      # Watch mode
npm run build           # Production build -> .output/chrome-mv3/
npm run build:firefox   # -> .output/firefox-mv2/
npm run test:e2e        # Playwright (needs a build first)
npm run visual-review   # Build, launch headless, screenshot popup + options
npm run dev:site        # Astro dev server for site/
```

## Definition of done

A change is done when **all** of these hold:

1. `npm test` exits green.
2. `npm run build` succeeds.
3. For any UI change: `npm run visual-review` ran and you inspected the
   screenshots in `screenshots/` (gitignored).
4. The user confirmed the behaviour in `npm run dev`.

Do not report a task complete on 1 and 2 alone.

Step 4 is manual and slow. Before you hand work back, close most of the gap with
the **`verify-extension-change` skill** — it runs the four-step loop and proves
the behaviour in real Chrome, so the user is confirming a change that already
ran, not debugging one that never did.

---

## Scope

**In scope for this repo:**

- The extension itself — `src/entrypoints/` (background service worker, content
  script, options SPA, command-palette popup), `src/actions/`,
  `src/components/`, `src/composables/`, `src/utils/`.
- The shortcut packs — JSON in `packs/official/` and `packs/community/`, wired
  into `ALL_PACKS` by `src/packs/index.ts`.
- The tests in `tests/` and `e2e/`.
- The community site in `site/` and the catalog generator in `scripts/`.

**Out of scope — do not work on this here:** the store release pipeline. Chrome
Web Store and Firefox Add-ons submission, listing copy review, screenshot
refreshes and version bumps are a manual process the maintainer owns. `marketing/`
holds reference copy only; treat it as read-only unless asked directly.

---

## Architecture you must know

**Action registry.** Actions dispatch through a `Record<string, ActionHandler>`
map in `src/actions/action-handlers.ts`. To add one: add the entry to
`ACTION_CATEGORIES` in `src/utils/actions-registry.ts`, add the handler, and
only then consider a manifest command (rule 1 applies). Page Script actions are
auto-registered from `src/utils/js-snippets.ts`.

**Where an action runs.** Most actions run in the background. Some run in the
content script, and the two lists are not the same — check both before you move
an action:

- Handled directly in `src/entrypoints/content.ts`, before any message reaches
  the background: `javascript`, `trigger`, `showcheatsheet`, `toggledarkmode`,
  `linkhints`, `linkhintsnew`, `editurl`, `buttonnexttab`.
- Forwarded from the background to the active tab (`contentScriptActions` in
  `background.ts`): `showcheatsheet`, `toggledarkmode`, `editurl`, `linkhints`,
  `linkhintsnew`, and `SCROLL_ACTIONS` — falling back to `handleAction` when no
  content script answers. This path is how the command-palette popup reaches
  them. Scrolling is here because the smooth scroller lives in the page;
  messaging the background per keystroke made held keys stutter.

**Live reload.** Saving shortcuts fires `storage.onChanged`; background
broadcasts `refreshKeys`; content scripts call `Mousetrap.reset()` and re-bind.
No page refresh. Keep that path intact.

**v4 data compatibility.** v5 reads v4 data unchanged: same JSON shape, same
field names, and `loadKeys()` still falls back to the legacy single `"keys"`
entry in both sync and local storage when no chunked payload is present. New
fields (`enabled`, `group`, `inserttext`) are optional and must degrade
gracefully. Never require a new field; never rename an existing one. Dedicated
migration tests cover this — keep them passing.

**Vim navigation.** `hint-targets.ts` finds targets, `link-hints.ts` owns the
overlay and keys, `smooth-scroll.ts` animates scrolling in the content script.
Global settings live in `vimSettings` (sync storage, `useVimSettings`);
per-shortcut `hintChars` and `smoothScrolling` override them.

---

## Gotchas that bite

- **Vue `v-for` keys:** use `row.id` (stable UUID), never `row.key` — the key
  string changes while the user types.
- **No `row` in the options template:** the `v-for` iterates `filteredIndices`,
  so bindings must read `keys[index].field`, not `row.field`. A test enforces it.
- **`e.code`, not `e.key`,** in `ShortcutRecorder.vue` — on Mac, `e.key` with
  Alt produces unicode (`option+l` → `¬`).
- **Meta and Ctrl are separate on Mac.** Conflict detection keeps separate
  default lists per platform. Never cross-map `ctrl` ↔ `meta`.
- **Content-script orphaning:** after an extension reload, old content scripts
  throw "Extension context invalidated". Guard every
  `browser.runtime.sendMessage` with a `chrome.runtime?.id` check.
- **Empty `key` field crashes** on `toLowerCase()`. Guard with
  `if (!keySetting.key) return`.
- **`shouldStopCallback`** must also treat `role="textbox"`, `role="combobox"`
  and `role="searchbox"` as text inputs (Reddit and similar).
- **`overflow: hidden` on a group** clips the `SearchSelect` dropdown. Don't add it.
- **jsdom has no layout:** mock `getClientRects()`, not only
  `getBoundingClientRect()`, or hint detection finds nothing. Reset
  `document.elementFromPoint` in `beforeEach` — it leaks between tests.
- **`var`, not `const`, in `registerHandlers`** — block scope breaks after
  `.toString()` serialization.
- **Labels are sentence case:** "Log all events", not "Log All Events".

`AGENTS.md` holds the long-tail reference: the full gotcha list, the file-level
map, and the Vimium-C derivation table. Read it when you touch an unfamiliar
module. Where the two files disagree, **this file wins** — and fix `AGENTS.md`.
Its stack counts are already stale (it says 416 tests; the real number is 840).

---

## Working style here

- Prefer the smallest diff that satisfies the requirement. Match the file's
  existing idiom rather than introducing a new one.
- Add a test with every behaviour change. `tests/` mirrors module names.
- Read `src/utils/` before you write a helper — most of them already exist.
- The options `App.vue` is very large. Read the section you are changing; do
  not reformat or reorganize it as a side effect.
