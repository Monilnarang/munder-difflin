/**
 * Grant a persistent agent scoped access to extra repositories at (re)spawn, as
 * a pure function so it can be unit-tested without a live PTY.
 *
 * The office keeps its on-floor agents alive forever rather than spawning a new
 * ephemeral worker per task. But a persistent agent is homed in ONE repo (its
 * `cwd`), and a task sometimes needs a repo it isn't homed in. Rather than
 * killing it and hiring a fresh worker elsewhere, the human grants THAT agent
 * scoped access to THAT repo — one approval, one directory — and the agent picks
 * the work up in its own terminal. The mechanism is Claude Code's own
 * `claude --add-dir <path>` flag (see src/shared/claudeCommands.ts): this builds
 * the `--add-dir <path>` argv additions from a persisted per-agent list.
 *
 * Rules, all of which a naive `dirs.flatMap(d => ['--add-dir', d])` would miss:
 *   - blank / non-string entries are dropped;
 *   - a directory that no longer exists on disk is dropped — `--add-dir` to a
 *     missing path makes Claude error at boot, which would turn "grant access"
 *     into "the agent won't start";
 *   - duplicates collapse, INCLUDING any dir already present as an `--add-dir`
 *     in the args assembled so far, so this is idempotent across a
 *     restart-and-continue that rebuilds the same argv.
 *
 * `exists` is injected (rather than importing node:fs) so the helper stays pure
 * and the test can probe a virtual filesystem.
 */
export function addDirArgs(
  addDirs: readonly unknown[] | undefined,
  existingArgs: readonly string[],
  exists: (path: string) => boolean
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  // Anything already granted in the args built so far must not be re-added.
  for (let i = 0; i < existingArgs.length - 1; i++) {
    if (existingArgs[i] === '--add-dir') seen.add(existingArgs[i + 1]);
  }
  for (const raw of addDirs ?? []) {
    const dir = typeof raw === 'string' ? raw.trim() : '';
    if (!dir || seen.has(dir)) continue;
    if (!exists(dir)) continue;
    seen.add(dir);
    out.push('--add-dir', dir);
  }
  return out;
}
