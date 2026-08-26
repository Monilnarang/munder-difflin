'use strict';

// Regression coverage for the agent roster card's whole-card click guard.
//
// The card <div> carries role="button", and its click handler runs
// e.target.closest('button, select, input, textarea, a, [role="button"]') to
// find the nearest interactive ancestor. closest() walks UP to and INCLUDING
// the card, which matches via its own role="button" — so a naive "if there's a
// match, bail" guard bails on EVERY click (the card always matches itself) and
// the card body never switches. shouldSwitchOnClick encodes the correct rule:
// switch unless the match is a genuine descendant control.

const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');

const { shouldSwitchOnClick } = loadTs('src/renderer/src/components/cardClickTarget.ts');

test('shouldSwitchOnClick', async (t) => {
  // Reference-identity stand-ins for DOM nodes — the helper only compares
  // nullness and identity, so no DOM harness is needed.
  const card = { tag: 'card' };
  const innerButton = { tag: 'button' };

  await t.test('no interactive hit (plain text / whitespace) → switch', () => {
    assert.equal(shouldSwitchOnClick(null, card), true);
  });

  await t.test('closest() matched the card itself (card body) → switch', () => {
    // This is the case the original guard got wrong: role="button" on the card
    // makes it its own closest() match for any body click.
    assert.equal(shouldSwitchOnClick(card, card), true);
  });

  await t.test('closest() matched a descendant control → do NOT switch', () => {
    assert.equal(shouldSwitchOnClick(innerButton, card), false);
  });
});
