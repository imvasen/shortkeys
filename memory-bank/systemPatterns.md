# System patterns

## Entry points

`src/entrypoints/` holds four: `background.ts` (service worker), `content.ts`
(injected in every page), `options/` (the settings SPA) and `popup/` (the
command palette).

## How an action dispatches

1. A registry entry in `ACTION_CATEGORIES` (`src/utils/actions-registry.ts`)
   declares the action: `value`, `label`, optional `description` and `builtin`.
2. A handler in the `Record<string, ActionHandler>` map in
   `src/actions/action-handlers.ts` implements it.
3. Only then consider a manifest command in `wxt.config.ts` — append-only.

Page Script actions are auto-registered from `src/utils/js-snippets.ts`.

## Where an action runs — two lists that do not match

This is the trap that costs the most time.

- **Handled inside `content.ts`**, before any message reaches the background:
  `javascript`, `trigger`, `showcheatsheet`, `toggledarkmode`, `linkhints`,
  `linkhintsnew`, `editurl`, `buttonnexttab`.
- **Forwarded from background to the active tab** (`contentScriptActions` in
  `background.ts`): `showcheatsheet`, `toggledarkmode`, `editurl`, `linkhints`,
  `linkhintsnew`, plus `SCROLL_ACTIONS`. It falls back to `handleAction` when no
  content script answers. This is the path the popup uses to reach them.

Check both lists before moving an action between contexts.

## Actions that need configuration

Some handlers read a per-shortcut field and do nothing without it: `openurl`,
`gototab*`, `openbookmark*`, `openapp`, `inserttext`, `javascript`, `trigger`,
`buttonnexttab`, `macro`, `namegroup`. `src/utils/palette.ts` keeps the list as
`ACTIONS_REQUIRING_CONFIG`, so the command palette never offers an action it
cannot configure.

The registry's `builtin: true` flag is **not** a reliable proxy for this — it is
applied inconsistently. `movetabtonewwindow` needs no configuration and lacks
the flag.

## Storage

`saveKeys()` chunks shortcuts across `keys_0`, `keys_1`, … with a `keys_meta`
entry, because `storage.sync` caps one item at 8,192 bytes. It falls back to
`storage.local` past the 100KB quota. `loadKeys()` still reads the legacy single
`"keys"` entry, which is how v4 data survives.

Never reproduce this by hand. Go through the two functions.

## Live reload

Saving fires `storage.onChanged` → background broadcasts `refreshKeys` → content
scripts call `Mousetrap.reset()` and re-bind. No page refresh. Keep it intact.

## Vim navigation

`hint-targets.ts` finds targets, `link-hints.ts` owns the overlay and keys,
`smooth-scroll.ts` animates scrolling in the content script. Global settings in
`vimSettings` (sync storage, `useVimSettings`); per-shortcut `hintChars` and
`smoothScrolling` override them. The modules are clean-room reimplementations —
see `NOTICE.md`. Never copy Vimium-C source.

*Verified 2026-09-24 against source, not against docs.*
