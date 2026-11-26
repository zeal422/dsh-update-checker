import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./sync-check.mjs', import.meta.url));

const identity = {
  GIT_AUTHOR_NAME: 'sync test',
  GIT_AUTHOR_EMAIL: 'sync@example.com',
  GIT_COMMITTER_NAME: 'sync test',
  GIT_COMMITTER_EMAIL: 'sync@example.com',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
};

const git = (cwd, args) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, ...identity },
  });

const run = (cwd) => {
  try {
    const stdout = execFileSync(process.execPath, [script], { cwd, encoding: 'utf8', stdio: 'pipe' });
    return { code: 0, output: stdout };
  } catch (error) {
    return { code: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  }
};

const temps = [];
const scratch = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-sync-'));
  temps.push(dir);
  return dir;
};

const fixture = () => {
  const root = scratch();
  const remote = path.join(root, 'remote.git');
  const local = path.join(root, 'local');
  git(root, ['init', '-q', '--bare', '--initial-branch=main', remote]);
  git(root, ['init', '-q', '-b', 'main', local]);
  fs.writeFileSync(path.join(local, 'file.txt'), 'one\n');
  git(local, ['add', '.']);
  git(local, ['commit', '-q', '-m', 'first']);
  git(local, ['remote', 'add', 'origin', remote]);
  git(local, ['push', '-q', '-u', 'origin', 'main']);
  return { root, remote, local };
};

test('passes when the branch matches its upstream', () => {
  const { local } = fixture();
  const result = run(local);
  assert.equal(result.code, 0);
  assert.match(result.output, /sync check ok/);
});

test('fails when the remote carries a commit this clone has not seen', () => {
  const { root, remote, local } = fixture();
  const other = path.join(root, 'other');
  git(root, ['clone', '-q', remote, other]);
  fs.writeFileSync(path.join(other, 'file.txt'), 'two\n');
  git(other, ['commit', '-q', '-am', 'second']);
  git(other, ['push', '-q']);
  const result = run(local);
  assert.equal(result.code, 1);
  assert.match(result.output, /behind/);
});

test('skips when the branch has no upstream', () => {
  const root = scratch();
  git(root, ['init', '-q', '-b', 'main']);
  fs.writeFileSync(path.join(root, 'file.txt'), 'one\n');
  git(root, ['add', '.']);
  git(root, ['commit', '-q', '-m', 'first']);
  const result = run(root);
  assert.equal(result.code, 0);
  assert.match(result.output, /skipped/);
});

test.after(() => {
  for (const dir of temps) fs.rmSync(dir, { recursive: true, force: true });
});
