/**
 * Launch the built extension in real Chrome and hand the running context to a
 * check function.
 *
 * Unit tests cannot prove that a keybinding fires, that a popup row dispatches,
 * or that a content script reaches the page. This does — in the same browser a
 * user runs.
 *
 * Usage (from the repo root, so Node finds node_modules):
 *
 *   npx tsx .claude/skills/verify-extension-change/scripts/my-check.ts
 *
 * and inside that file:
 *
 *   import { withExtension } from './with-extension'
 *
 *   await withExtension(async ({ context, popupUrl }) => {
 *     const popup = await context.newPage()
 *     await popup.goto(popupUrl)
 *     // …drive it, then print what you observed
 *   })
 */

import { chromium, type BrowserContext } from '@playwright/test'
import path from 'path'
import { execSync } from 'child_process'

const EXTENSION_PATH = path.resolve('.output/chrome-mv3')

export interface ExtensionHandle {
  context: BrowserContext
  extensionId: string
  /** chrome-extension://<id>/popup.html */
  popupUrl: string
  /** chrome-extension://<id>/options.html */
  optionsUrl: string
}

export interface WithExtensionOptions {
  /** Build first. Default true — a stale .output/ silently checks the old code. */
  build?: boolean
  /** Show the window. Default false (headless). */
  headed?: boolean
}

export async function withExtension(
  check: (handle: ExtensionHandle) => Promise<void>,
  options: WithExtensionOptions = {},
): Promise<void> {
  const { build = true, headed = false } = options

  if (build) {
    console.log('Building extension...')
    execSync('npm run build', { stdio: 'inherit' })
  }

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      ...(headed ? [] : ['--headless=new']),
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--disable-default-apps',
    ],
  })

  try {
    // The service worker carries the extension id.
    let [sw] = context.serviceWorkers()
    if (!sw) sw = await context.waitForEvent('serviceworker')
    const extensionId = sw.url().split('/')[2]

    // Close the welcome/options tabs the extension opens on install, so the
    // check starts from a known tab count.
    const deadline = Date.now() + 3000
    while (context.pages().length < 2 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200))
    }
    for (const p of context.pages()) await p.close().catch(() => {})

    console.log(`Extension loaded: ${extensionId}`)
    await check({
      context,
      extensionId,
      popupUrl: `chrome-extension://${extensionId}/popup.html`,
      optionsUrl: `chrome-extension://${extensionId}/options.html`,
    })
  } finally {
    await context.close()
  }
}
