'use strict';

/**
 * Forever-running agents take cross-repo work by being GRANTED scoped access to
 * a repo they aren't homed in, via Claude Code's `--add-dir`. addDirArgs turns a
 * persisted per-agent grant list into the argv additions, and the correctness
 * that matters can't be seen by eye:
 *   - a `--add-dir` to a path that no longer exists makes Claude error at boot,
 *     so "grant access" would silently become "the agent won't start";
 *   - a restart & continue rebuilds the same argv, so re-adding a dir already
 *     present would double every grant on each restart.
 * A pure function + this test pin both down without a live spawn.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');

const { addDirArgs } = loadTs('src/shared/addDirArgs.ts');

// A virtual filesystem probe — only these paths "exist".
const existsIn = (set) => (p) => set.has(p);

test('emits --add-dir for each existing granted dir', () => {
  const exists = existsIn(new Set(['/repo/a', '/repo/b']));
  assert.deepEqual(
    addDirArgs(['/repo/a', '/repo/b'], [], exists),
    ['--add-dir', '/repo/a', '--add-dir', '/repo/b']
  );
});

test('drops a granted dir that no longer exists (would crash Claude at boot)', () => {
  const exists = existsIn(new Set(['/repo/a']));
  assert.deepEqual(
    addDirArgs(['/repo/a', '/repo/gone'], [], exists),
    ['--add-dir', '/repo/a']
  );
});

test('drops blanks and non-string entries', () => {
  const exists = existsIn(new Set(['/repo/a']));
  assert.deepEqual(
    addDirArgs(['', '   ', null, undefined, 42, '/repo/a'], [], exists),
    ['--add-dir', '/repo/a']
  );
});

test('trims whitespace around a pasted path', () => {
  const exists = existsIn(new Set(['/repo/a']));
  assert.deepEqual(addDirArgs(['  /repo/a  '], [], exists), ['--add-dir', '/repo/a']);
});

test('de-duplicates within the grant list', () => {
  const exists = existsIn(new Set(['/repo/a']));
  assert.deepEqual(addDirArgs(['/repo/a', '/repo/a'], [], exists), ['--add-dir', '/repo/a']);
});

test('idempotent: skips a dir already granted in the args built so far', () => {
  const exists = existsIn(new Set(['/repo/a', '/repo/b']));
  // Simulates a restart & continue whose argv already carries the prior grant.
  assert.deepEqual(
    addDirArgs(['/repo/a', '/repo/b'], ['--model', 'x', '--add-dir', '/repo/a'], exists),
    ['--add-dir', '/repo/b']
  );
});

test('no grants → no args', () => {
  const exists = existsIn(new Set(['/repo/a']));
  assert.deepEqual(addDirArgs(undefined, [], exists), []);
  assert.deepEqual(addDirArgs([], ['--model', 'x'], exists), []);
});
