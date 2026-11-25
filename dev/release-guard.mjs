#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const base = process.argv[2];
if (!base) {
  console.error('usage: node dev/release-guard.mjs <base-ref>');
  process.exit(2);
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const changed = git(['diff', '--name-only', `${base}...HEAD`]).split('\n').filter(Boolean);
const failures = [];

if (changed.includes('CHANGELOG.md')) {
  failures.push('CHANGELOG.md is written by semantic-release, not by hand');
}

let baseVersion = '';
try {
  baseVersion = JSON.parse(git(['show', `${base}:package.json`])).version;
} catch (error) {
  console.error(`release guard: could not read ${base}:package.json (${error.message})`);
  process.exit(2);
}
const headVersion = JSON.parse(git(['show', 'HEAD:package.json'])).version;
if (baseVersion !== headVersion) {
  failures.push(`package.json version moved from ${baseVersion} to ${headVersion}; releases bump it, pull requests do not`);
}

if (failures.length > 0) {
  console.error('release guard failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('release guard ok (no hand edits to version or changelog)');
