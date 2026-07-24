import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

test('reference runner resolves every repository path', () => {
  const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
  const output = execFileSync(
    'bash',
    ['reference/run_signal_daily.sh'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        CLAUDE_BIN: '/bin/false',
        GH_BIN: '/bin/false',
        SIGNAL_CHECK_ONLY: '1',
        SIGNAL_LOCK_FILE: '/tmp/signal-runner-path-test.lock',
        SIGNAL_LOG_FILE: '/tmp/signal-runner-path-test.log',
        SIGNAL_REPO_DIR: repoRoot,
        SIGNAL_WORKTREE_DIR: '/tmp/signal-runner-path-test-worktree',
      },
    },
  );

  assert.match(output, /reference\/SKILL\.md: OK/);
  assert.match(output, /reference\/validate-staging\.mjs: OK/);
  assert.match(output, /site\/content\/staging: OK/);
  assert.match(output, /site\/content\/published: OK/);
});
