/**
 * Worked example — the check written for issue #975.
 *
 * Claim: a command-palette row for an action the user never bound a key to
 * really executes, not just renders.
 *
 * Run from the repo root:
 *   npx tsx .claude/skills/verify-extension-change/scripts/palette-runs-unassigned-action.ts
 */

import { withExtension } from './with-extension'

// The repo is CommonJS, so there is no top-level await. Wrap it in main().
async function main() {
  await withExtension(async ({ context, popupUrl }) => {
    // Three ordinary tabs to act on.
    for (const name of ['A', 'B', 'C']) {
      const page = await context.newPage()
      await page.goto(`data:text/html,<title>${name}</title>${name}`)
    }
    console.log('tabs before:', context.pages().length)

    const popup = await context.newPage()
    await popup.goto(popupUrl)
    await popup.waitForSelector('.popup')
    await popup.fill('.search-bar input', 'close other tabs')
    await popup.waitForSelector('.result-row')

    const rows = await popup.locator('.result-row').count()
    const label = await popup.locator('.result-row .result-label').first().textContent()
    console.log(`rows: ${rows} | first label: ${label}`)

    await popup.locator('.search-bar input').press('Enter')
    await new Promise((r) => setTimeout(r, 2500))

    const remaining = context.pages().filter((p) => !p.isClosed())
    console.log('tabs after:', remaining.length)
    console.log(
      remaining.length < 4
        ? 'PASS — the unassigned entry dispatched and tabs closed.'
        : 'FAIL — nothing happened; the message never reached the handler.',
    )

    // Known limit: here the popup is its own tab, so it is the "current" tab.
    // Whether onlytab spares the *right* tab still needs `npm run dev`.
  })
}

main()
