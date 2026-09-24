import { ACTION_CATEGORIES } from './actions-registry'
import type { KeySetting } from './url-matching'

/**
 * Actions that do nothing without per-shortcut configuration: the handler reads
 * a field the user fills in on the options page (a URL, a bookmark title, a JS
 * snippet, a macro). The palette has nowhere to ask for that value, so these
 * never appear as unassigned entries.
 *
 * Verified against the handlers in src/actions/action-handlers.ts and the
 * content-script branch in src/entrypoints/content.ts. Keep in sync when a new
 * action starts reading a KeySetting field.
 */
export const ACTIONS_REQUIRING_CONFIG = new Set([
  'openurl',
  'gototab',
  'gototabbytitle',
  'gototabbyindex',
  'openbookmark',
  'openbookmarknewtab',
  'openbookmarkbackgroundtab',
  'openbookmarkbackgroundtabandclose',
  'openapp',
  'inserttext',
  'javascript',
  'trigger',
  'buttonnexttab',
  'macro',
  'namegroup',
])

/** One row in the command palette. */
export interface PaletteEntry {
  /** Stable row key for rendering. */
  id: string
  /** Primary text: the user's own label, else the action's registry label. */
  label: string
  /** The action's registry label. Searchable, and the secondary text on a
   *  configured row. */
  actionLabel: string
  /** Secondary text under the label: the action label on a configured row, the
   *  action's description on an unassigned one. Empty when there is nothing to
   *  add. */
  sublabel: string
  /** The action value, e.g. 'onlytab'. */
  action: string
  /** The assigned keybinding, or '' for an action the user never bound. */
  key: string
  /** False when this is a built-in action with no shortcut configured. */
  configured: boolean
  /** What to send to the background script to execute this entry. */
  payload: KeySetting
}

function actionLabelMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const actions of Object.values(ACTION_CATEGORIES)) {
    for (const a of actions) map[a.value] = a.label
  }
  return map
}

/**
 * Build the full palette: the user's configured shortcuts first, then every
 * built-in action they have not bound a key to (issue #975).
 *
 * An action is listed once. If a shortcut already points at it, only the
 * configured row appears — the configured row carries the user's own label and
 * the extra fields the handler may need.
 */
export function buildPaletteEntries(keys: KeySetting[]): PaletteEntry[] {
  const labels = actionLabelMap()
  const configured = keys.filter((k) => k.enabled !== false && k.key && k.action)

  const entries: PaletteEntry[] = configured.map((k, i) => ({
    id: k.id || `configured:${k.action}:${i}`,
    label: k.label || labels[k.action] || k.action,
    actionLabel: labels[k.action] || k.action,
    sublabel: labels[k.action] || k.action,
    action: k.action,
    key: k.key,
    configured: true,
    payload: k,
  }))

  const bound = new Set(configured.map((k) => k.action))
  for (const actions of Object.values(ACTION_CATEGORIES)) {
    for (const a of actions) {
      if (bound.has(a.value)) continue
      if (ACTIONS_REQUIRING_CONFIG.has(a.value)) continue
      entries.push({
        id: `unassigned:${a.value}`,
        label: a.label,
        actionLabel: a.label,
        // The label is already the row's primary text — repeating it below
        // reads as a rendering bug. Show what the action does instead.
        sublabel: a.description || '',
        action: a.value,
        key: '',
        configured: false,
        // No id: usage tracking counts configured shortcuts, and there is no
        // shortcut to count here.
        payload: { key: '', action: a.value },
      })
    }
  }

  return entries
}

/**
 * Narrow the palette to the query.
 *
 * With no query the popup stays the shortcut list it has always been.
 * Unassigned actions surface once the user types: #975 asks for discovery by
 * search, and listing every built-in action on open would bury the shortcuts
 * the user set up on purpose.
 */
export function filterPaletteEntries(entries: PaletteEntry[], query: string): PaletteEntry[] {
  const q = query.toLowerCase().trim()
  if (!q) return entries.filter((e) => e.configured)
  return entries.filter((e) => {
    return (
      e.label.toLowerCase().includes(q) ||
      e.key.toLowerCase().includes(q) ||
      e.actionLabel.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q)
    )
  })
}
