# Memory bank

Session-to-session memory for Shortkeys. A new agent session reads this folder
first and recovers the project state without asking.

Read in this order:

| File | Answers |
| --- | --- |
| `projectbrief.md` | What this is and what it must never break |
| `productContext.md` | Who uses it and why it exists |
| `systemPatterns.md` | How the pieces fit together |
| `techContext.md` | Stack, commands, environment |
| `activeContext.md` | What is in flight **right now** |
| `progress.md` | What works, what is left, known issues |

## Division of labour

`CLAUDE.md` holds the **rules** — the never-ever list, the definition of done,
scope. It is loaded on every session automatically.

This folder holds the **state** — what is happening and where it stands. Rules
change rarely; state changes every session.

`AGENTS.md` is the long-tail reference. Where it disagrees with `CLAUDE.md`,
`CLAUDE.md` wins.

## Update rule

`activeContext.md` and `progress.md` are updated at the end of any session that
changed the code. The other four change only when the project itself changes
shape.

Every claim here carries a verification date. A claim with no date is a guess —
delete it or verify it.
