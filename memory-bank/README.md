# Memory bank

Session-to-session memory for Shortkeys. A new agent session reads this folder
first and recovers the project state without asking.

Read in this order:

| File | Answers |
| --- | --- |
| `project_brief.md` | Goals and scope — what this is, and what it must never break |
| `product_context.md` | Who uses it and why it exists |
| `tech_context.md` | Stack, commands, environment, and how the pieces fit together |
| `active_context.md` | What is in flight **right now** |
| `progress.md` | Status — what works, what is left, known issues |

Five files, as the Session 4 spec asks, each well under 200 lines. Architecture
lives in `tech_context.md`, which is where the session-end ritual says to put an
architecture choice. This README is a guide to the folder, not a sixth memory
file.

## Division of labour

`CLAUDE.md` holds the **rules** — the never-ever list, the definition of done,
scope. It is loaded on every session automatically.

This folder holds the **state** — what is happening and where it stands. Rules
change rarely; state changes every session.

`AGENTS.md` is the long-tail reference. Where it disagrees with `CLAUDE.md`,
`CLAUDE.md` wins.

## Keep episodic content out of semantic memory

`active_context.md` is episodic — what is happening now. `project_brief.md`,
`product_context.md` and `tech_context.md` are semantic — what is true in
general. When work finishes, its outcome moves to `progress.md` and its detail
moves into a commit message body. Do not let `active_context.md` become a
graveyard of old notes.

## Update rule

`active_context.md` and `progress.md` are updated at the end of any session that
changed the code. The other four change only when the project itself changes
shape.

Every claim here carries a verification date. A claim with no date is a guess —
delete it or verify it.

## Re-derive the counts, never retype them

Every number below was wrong in the first draft of this folder, because it was
counted by eye or by a regex that silently missed rows. Run the command.

```bash
npx tsx -e "import {ACTION_CATEGORIES} from './src/utils/actions-registry'
  const a = Object.values(ACTION_CATEGORIES).flat()
  console.log(a.length, 'actions in', Object.keys(ACTION_CATEGORIES).length, 'categories')"

grep -c "'[0-9][0-9]-" wxt.config.ts   # manifest commands — append-only, rule 1
ls src/utils/*.ts | wc -l              # utils modules
ls src/composables/*.ts | wc -l        # composables
ls packs/official/*.json | wc -l       # shipped packs
ls packs/community/*.json | wc -l
npm test                               # test count and file count
grep -n node-version .github/workflows/ci.yml   # the Node version CI actually uses
```

Two traps that produced real errors here:

- `ls … | head -5` prints five rows whether there are five or nine. Pipe to
  `wc -l`, never to `head`.
- A regex over `actions-registry.ts` missed 24 of 135 entries. Import the module
  and count the array instead of matching its source text.
