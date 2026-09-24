import { describe, it, expect } from 'vitest'
import type { KeySetting } from '../src/utils/url-matching'
import {
  buildPaletteEntries,
  filterPaletteEntries,
  ACTIONS_REQUIRING_CONFIG,
} from '../src/utils/palette'

/**
 * Tests for the command palette surfacing unassigned built-in actions (#975).
 * These test the data flow and logic — the actual Vue component rendering
 * is tested via E2E tests.
 */

function search(keys: KeySetting[], query: string) {
  return filterPaletteEntries(buildPaletteEntries(keys), query)
}

describe('command palette entries', () => {
  it('finds a built-in action on a profile with zero configured shortcuts', () => {
    const results = search([], 'close other tabs')

    expect(results).toHaveLength(1)
    expect(results[0].action).toBe('onlytab')
    expect(results[0].label).toBe('Close other tabs')
    expect(results[0].configured).toBe(false)
    expect(results[0].key).toBe('')
  })

  it('shows one row, not two, when the action is already configured', () => {
    const keys: KeySetting[] = [
      { key: 'ctrl+shift+o', action: 'onlytab', id: 'configured-1', enabled: true },
    ]

    const results = search(keys, 'close other tabs')

    expect(results).toHaveLength(1)
    expect(results[0].configured).toBe(true)
    expect(results[0].key).toBe('ctrl+shift+o')
  })

  it('describes an unassigned action instead of repeating its label', () => {
    const [entry] = search([], 'close other tabs')

    expect(entry.sublabel).toBe('Close all tabs except the current one')
    expect(entry.sublabel).not.toBe(entry.label)
  })

  it('never lists the same action twice across the whole palette', () => {
    const keys: KeySetting[] = [
      { key: 'ctrl+b', action: 'newtab', id: 'a', enabled: true },
      { key: 'ctrl+shift+o', action: 'onlytab', id: 'b', enabled: true },
    ]

    const actions = buildPaletteEntries(keys).map((e) => e.action)

    expect(new Set(actions).size).toBe(actions.length)
  })

  it('keeps the no-query popup to configured shortcuts only', () => {
    const keys: KeySetting[] = [
      { key: 'ctrl+b', action: 'newtab', id: 'a', enabled: true },
    ]

    const results = search(keys, '')

    expect(results).toHaveLength(1)
    expect(results[0].action).toBe('newtab')
  })

  it('omits actions that need per-shortcut configuration', () => {
    const unassigned = buildPaletteEntries([]).filter((e) => !e.configured)

    for (const action of ACTIONS_REQUIRING_CONFIG) {
      expect(unassigned.map((e) => e.action)).not.toContain(action)
    }
    expect(search([], 'go to url')).toHaveLength(0)
  })

  it('still offers a configured "Go to URL" shortcut, with its own fields', () => {
    const keys: KeySetting[] = [
      {
        key: 'ctrl+g',
        action: 'openurl',
        openurl: 'https://example.com',
        id: 'c',
        enabled: true,
      },
    ]

    const results = search(keys, 'go to url')

    expect(results).toHaveLength(1)
    expect(results[0].payload.openurl).toBe('https://example.com')
  })

  it('sends no shortcut id for an unassigned action, so usage tracking stays clean', () => {
    const [entry] = search([], 'close other tabs')

    expect(entry.payload.id).toBeUndefined()
    expect(entry.payload.action).toBe('onlytab')
  })

  it('offers the action as unassigned when the user disabled their shortcut', () => {
    const keys: KeySetting[] = [
      { key: 'ctrl+shift+o', action: 'onlytab', id: 'd', enabled: false },
    ]

    const results = search(keys, 'close other tabs')

    expect(results).toHaveLength(1)
    expect(results[0].configured).toBe(false)
  })

  it('matches on the user label, the keybinding and the action value', () => {
    const keys: KeySetting[] = [
      { key: 'ctrl+b', action: 'newtab', label: 'Blank page', id: 'e', enabled: true },
    ]

    expect(search(keys, 'blank')[0].action).toBe('newtab')
    expect(search(keys, 'ctrl+b')[0].action).toBe('newtab')
    expect(search(keys, 'onlytab')[0].action).toBe('onlytab')
  })
})
