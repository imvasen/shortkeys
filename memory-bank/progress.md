# Progress

*Updated 2026-09-24.*

## Works

- 111 actions across the registry, dispatching through the handler map.
- Per-site and global shortcuts, URL and title matching, groups, blacklists.
- 5 official packs plus community packs; import and export; share links.
- Vim navigation — link hints, smooth scrolling, per-shortcut overrides.
- Command palette in the browser-action popup, with quick-add.
- v4 data reads unchanged, including the legacy single `"keys"` storage entry.
- 850 unit tests in 31 files, plus a Playwright e2e suite.
- Chrome MV3 and Firefox MV2 build from one source.

## In progress

**Issue #975, part 1** — unassigned built-in actions in the palette. Code
complete and verified in Chrome; waiting on a live `npm run dev` check. See
`activeContext.md`.

## Not started

- Issue #975 part 2 — show the keybinding next to a configured shortcut.
- Issue #975 part 3 — rank configured shortcuts above unassigned actions.

## Known issues

- **`AGENTS.md` is stale.** It claims 416 tests in 14 files; the real number is
  850 in 31. It claims v4 and v5 share the storage key `"keys"`; storage is
  chunked and `"keys"` is only a legacy read path. It describes one
  content-script action list; there are two, and they differ. `CLAUDE.md` wins
  on conflict, and `AGENTS.md` should be corrected.
- **`builtin: true` in the action registry is applied inconsistently.** Treat it
  as a hint, never as a gate. `ACTIONS_REQUIRING_CONFIG` in
  `src/utils/palette.ts` is the reliable list.
- **The visual-review script only captures states someone added by hand.** A new
  UI state is invisible to it until a capture is written. It missed the whole
  #975 feature until a capture was added.

## Decisions that are settled

- Manifest command keys are append-only. Not negotiable — 200,000 installs.
- All storage goes through `saveKeys()` / `loadKeys()`.
- Nothing is committed before the user tests it in `npm run dev`.
- Vim modules stay clean-room. Never copy Vimium-C source. See `NOTICE.md`.
