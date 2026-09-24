# Evidence that the skill triggers

Two non-interactive runs, 2026-09-24, Claude Code 2.1.267, from the repo root.
Neither prompt names the skill.

## Run 1 — the skill is selected from the description alone

```bash
claude -p "I just changed the command palette in src/entrypoints/popup/App.vue. \
Confirm it works before I hand it back. Do not run anything yet — first tell me \
which skill applies here and list the steps it prescribes." --output-format json
```

Answer, opening line:

> **Skill: `verify-extension-change`** (`.claude/skills/verify-extension-change/SKILL.md`).
> It matches on two counts: the edit is under `src/`, and it touches the popup —
> the command palette.

It then reproduced all four steps, the three repo rules, and the three limits the
skill says to state out loud rather than paper over.

## Run 2 — the skill is actually invoked, not merely described

```bash
claude -p "I changed the palette UI. Verify it works — run only step 1 of the \
loop, then stop and report." --output-format stream-json --verbose
```

Tool calls extracted from the stream:

```
TOOL: Skill {"skill": "verify-extension-change"}
TOOL: Bash  {"command": "npm test 2>&1 | tail -40", "description": "Run unit test suite"}
```

The `Skill` call is the trigger: Claude Code loaded `SKILL.md` on its own, with
no `/verify-extension-change` in the prompt. It went straight to step 1 —
`npm test` — exactly as the skill prescribes.

The command was then refused by the permission layer, because a non-interactive
session cannot ask for approval. The reply:

> **Status of step 1: not run.** I have no test count to report, and I am not
> going to infer one from the 840 baseline in `CLAUDE.md` — that number predates
> your palette change […] Nothing else in the loop ran — no build, no visual
> review, no real-Chrome check — and the palette UI behaviour is entirely
> unverified at this point.

That is the skill's own rule working: *stop at the first failure and report it —
do not continue and summarize at the end.* It refused to guess a test count and
refused to call anything verified.

## Over- and under-triggering

Session 3 asks for one observation on over- or under-triggering. Four probes,
each a fresh non-interactive session, none naming the skill.

| # | Prompt | Should fire | First draft | After the fix |
| --- | --- | --- | --- | --- |
| A | "What does the Astro site in `site/` do? Just explain it…" | no | no | no |
| B | "Explain how `src/utils/storage.ts` chunks shortcuts. Read-only…" | no | no | no |
| C | "Is the palette change safe to ship?" | **yes** | **no** | **yes** |
| D | "Can I commit this?" | depends | no | no |

### The finding: it under-triggered on the highest-stakes phrasing

Probe C is the exact moment the skill exists for — and it missed. The session
did not sit idle; it improvised its own safety review, read the diff, and
correctly checked all three never-ever rules. But it never ran the tests, the
build, the visual review, or the browser check. It answered "not yet" from
reading code alone. A plausible verdict with nothing executed behind it is worse
than no verdict.

**Cause.** The first description enumerated verbs and paths — *verify*, *check*,
*confirm*, *any edit under `src/`*. Nobody asks that way at the moment of
deciding. They ask about the **outcome**: safe to ship, ready to merge, done.

**Fix.** The description now names the outcome phrasings alongside the verbs. C
fires; A and B still do not, so the widening did not cost precision.

### Probe B is the control that matters

B mentions a real path under `src/`, which the first description named
explicitly. It still did not fire — correctly, because the request is read-only.
The skill keys on *changing* something, not on the word `src/`.

### Probe D was right to stay quiet

D still does not fire, and that is not a defect. At that moment the working tree
held only documentation, and the session said so: *"This is docs-only. No
`src/`, no `wxt.config.ts` command keys… there's no behaviour to confirm."* A
skill that fired on every "can I commit this?" would be noise. Left as is.

## Reproduce

```bash
cd shortkeys
claude -p "I changed the palette UI. Verify it works." --output-format stream-json --verbose \
  | grep -o '"name":"Skill","input":{"skill":"[^"]*"'
```

## The harness under it runs too

```
$ npx tsx .claude/skills/verify-extension-change/scripts/palette-runs-unassigned-action.ts
Extension loaded: nfacdjnbdhdmlminmaloioegnfldhfno
tabs before: 3
rows: 1 | first label: Close other tabs
tabs after: 0
PASS — the unassigned entry dispatched and tabs closed.
```
