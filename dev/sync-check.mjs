#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const git = (args, options = {}) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: 'pipe', ...options }).trim();

let upstream;
try {
  upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
} catch {
  console.log('sync check skipped (the branch has no upstream)');
  process.exit(0);
}

const remote = upstream.split('/')[0];
try {
  git(['fetch', '--quiet', remote], { timeout: 20000 });
} catch {
  console.log(`sync check skipped (could not reach ${remote})`);
  process.exit(0);
}

const behind = Number(git(['rev-list', '--count', `HEAD..${upstream}`]));
if (behind === 0) {
  console.log(`sync check ok (up to date with ${upstream})`);
  process.exit(0);
}

console.error(`sync check failed: HEAD is ${behind} commit(s) behind ${upstream}.`);
console.error('CI commits to the remote, not to this clone. Rebase before committing:');
console.error('  git rebase --autostash @{u}');
process.exit(1);
