/**
 * Decide whether a click on an agent roster card should switch the active
 * agent.
 *
 * The card container carries `role="button"`, and its interactive descendants
 * (name label aside) are real `<button>` / `<select>` / `<input>` elements.
 * A click handler on the card runs `e.target.closest(interactiveSelector)` to
 * find the nearest interactive ancestor of what was clicked — but `closest()`
 * walks UP to and including the card itself, which matches the selector via its
 * own `role="button"`. So for a click anywhere in the card body the match is
 * the card; for a click on an inner control the match is that control.
 *
 * Switch only when the click did NOT land on an inner interactive control:
 *   - no match at all (e.g. plain text/whitespace)      → switch
 *   - the match IS the card itself (card body)          → switch
 *   - the match is a descendant control (button/select) → do NOT switch;
 *                                                          it runs its own action
 */
export function shouldSwitchOnClick(
  hit: Element | null,
  card: EventTarget | null
): boolean {
  return !hit || hit === card;
}
