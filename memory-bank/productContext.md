# Product context

## The problem

Browsers give you a fixed, small set of keyboard shortcuts. Power users want
their own — Vim-style navigation, tab surgery, a shortcut that runs a snippet on
a specific site. No browser ships that.

## Who uses it

Two groups, and they pull in different directions.

**Long-time users**, many since v4. They have shortcuts configured and
memorised. They want nothing to change. They are the reason for the append-only
manifest rule and the v4 compatibility path.

**New users** who install it and find a blank options page. They are the reason
for the shortcut packs (`packs/official/`: developer, emacs, keyboard-power,
media-control, productivity), the onboarding wizard, and the command palette.

## How it should feel

- **Invisible when it works.** A shortcut fires in the page with no perceptible
  delay. This is why smooth scrolling lives in the content script: routing every
  keystroke through the background made held keys stutter.
- **No reload to take effect.** Saving a shortcut re-binds live via
  `storage.onChanged` → `refreshKeys` → `Mousetrap.reset()`.
- **Discoverable.** The command palette (browser-action popup) is how a user
  finds an action without memorising a key. Issue #975 is the current work on
  this: the palette should surface the whole action library, not only what the
  user already configured.

## What it is not

Not a macro recorder for sale, not a data product. There is no telemetry beyond
local usage counts used to time a review prompt.

*Verified 2026-09-24.*
