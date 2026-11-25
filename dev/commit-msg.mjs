#!/usr/bin/env node
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const PREFIX = /^(feat|fix|docs|chore|refactor|test|perf|build|ci)(\([a-z0-9-]+\))?: \S/;
const EXEMPT = /^(Merge |Revert |Initial commit|chore\(release\):)/;
const MAX_SUBJECT = 72;

/**
 * Check one commit message against the repo convention.
 * @param {string} message Raw message text.
 * @returns {string[]} Violations, empty when the message is fine.
 */
export function validate(message) {
  const kept = message
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !line.startsWith('#'));
  const subject = (kept[0] ?? '').trimEnd();
  if (EXEMPT.test(subject)) return [];

  const errors = [];
  if (subject.length === 0) {
    errors.push('the subject line is empty');
    return errors;
  }
  if (!PREFIX.test(subject)) {
    errors.push('start the subject with a conventional prefix, for example "feat: ..." or "fix: ..."');
  }
  if (subject.length > MAX_SUBJECT) {
    errors.push(`the subject is ${subject.length} characters, keep it at ${MAX_SUBJECT} or fewer`);
  }
  if (subject.endsWith('.')) {
    errors.push('drop the trailing period from the subject');
  }
  if (kept.length > 1 && kept[1].trim() !== '') {
    errors.push('leave a blank line between the subject and the body');
  }
  const bullets = kept.slice(2).filter((line) => /^- \S/.test(line));
  if (bullets.length === 0) {
    errors.push('add at least one body bullet, each line starting with "- "');
  }
  return errors;
}

function report(label, errors) {
  if (errors.length === 0) return 0;
  console.error(`\n${label}`);
  for (const error of errors) console.error(`  - ${error}`);
  return 1;
}

const [arg, ...rest] = process.argv.slice(2);

if (arg === '--range') {
  const range = rest[0];
  if (!range) {
    console.error('usage: node dev/commit-msg.mjs --range <git-range>');
    process.exit(2);
  }
  const raw = execFileSync('git', ['log', '--format=%x1e%H%x1f%B', range], { encoding: 'utf8' });
  const entries = raw.split('\x1e').filter((chunk) => chunk.trim() !== '').map((chunk) => {
    const [hash, body] = chunk.split('\x1f');
    return { hash: (hash ?? '').trim(), message: body ?? '' };
  });
  let failed = 0;
  for (const entry of entries) {
    const errors = validate(entry.message);
    if (errors.length > 0) {
      failed += 1;
      report(`${entry.hash.slice(0, 7)}: ${(entry.message.split('\n')[0] ?? '').trim()}`, errors);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} commit message(s) do not follow the convention.\n`);
    process.exit(1);
  }
  console.log(`commit messages ok (${entries.length} checked)`);
  process.exit(0);
}

if (arg === undefined || arg.startsWith('--')) {
  console.error('usage: node dev/commit-msg.mjs <message-file> | --range <git-range>');
  process.exit(2);
}

const errors = validate(fs.readFileSync(arg, 'utf8'));
process.exit(report('commit message rejected:', errors));
