# Project brief

**Shortkeys** is a cross-browser extension that lets a user bind custom keyboard
shortcuts to browser actions. Version 5.0.1. Around 200,000 Chrome users.

`origin` is the fork `imvasen/shortkeys`. `upstream` is `crittermike/shortkeys`.
Work lands on the fork. Never open a pull request against `upstream` by accident.

## What it must do

1. Let a user bind a key to any of 135 built-in actions across 12 categories,
   per site or globally.
2. Keep every shortcut a user already configured working, across versions.
3. Fire reliably in a live page, on Chrome, Firefox, Edge and Opera.

## The constraint that shapes everything

**The install base.** 200,000 people already have shortcuts stored in their
browser profile. A refactor that looks tidy in the diff can silently destroy
their bindings. Two consequences, both absolute:

- Manifest command keys in `wxt.config.ts` are **append-only**. The browser
  stores those keys to remember the shortcut each user assigned. Renaming one
  reassigns or destroys that binding for every installed user. There are 90 of
  them.
- Storage goes through `saveKeys()` / `loadKeys()` in `src/utils/storage.ts`.
  Never call `browser.storage` directly.

## Success

A change is done when the tests pass, the build passes, the screenshots were
inspected, and **the user confirmed it in `npm run dev`**. Not before.

*Verified 2026-09-24.*
