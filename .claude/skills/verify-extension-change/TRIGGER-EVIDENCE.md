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
