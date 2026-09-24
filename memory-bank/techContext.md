# Tech context

## Stack

| Layer | Choice |
| --- | --- |
| Build | WXT — emits `chrome-mv3` and a Firefox MV2 variant |
| UI | Vue 3, Composition API, `<script setup>` |
| Language | TypeScript |
| Unit tests | Vitest + jsdom, in `tests/` |
| E2E | Playwright, in `e2e/` |
| Community site | Astro, in `site/` |
| Key binding | Mousetrap, in the content script |

The repo is **CommonJS** — `package.json` has no `"type": "module"`. Standalone
`tsx` scripts cannot use top-level `await`; wrap them in `main()`.

## Commands

```bash
npm test              # Vitest — 850 passing in 31 files (2026-09-24)
npm run build         # WXT build, also type-checks templates
npm run dev           # load the extension live; the only real confirmation
npm run visual-review # build, launch Chrome, capture screenshots/
npm run test:e2e      # Playwright
```

`screenshots/` is gitignored.

## Layout

```
src/entrypoints/   background.ts, content.ts, options/, popup/
src/actions/       action-handlers.ts — the handler map
src/utils/         16 modules: storage, actions-registry, palette, url-matching,
                   link-hints, hint-targets, smooth-scroll, js-snippets, …
src/composables/   16 composables: useShortcuts, useVimSettings, usePacks, …
packs/official/    5 shipped packs
packs/community/   community-contributed packs
tests/  e2e/  site/
```

## Environment

CI runs Node 22.x (`.github/workflows/ci.yml`). `package.json` declares no
`engines` field, so nothing enforces a floor — do not quote a minimum version as
if the repo stated one. No API keys, no services, no database.
`npm install && npm test` is the whole setup.

## Verification harness

`.claude/skills/verify-extension-change/` holds `with-extension.ts`, which
launches the built extension in real Chrome and hands a check the running
context. Unit tests cannot prove a binding fires; this can. Run its scripts from
the repo root so Node resolves `@playwright/test`.

*Verified 2026-09-24.*
