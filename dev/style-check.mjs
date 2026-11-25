#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const files = ['index.js', 'client.js'];

const lineComment = /^\s*\/\//;
const blockComment = /^\s*\/\*/;
const trailingComment = /;\s*\/\//;

const failures = [];
for (const file of files) {
  const lines = fs.readFileSync(path.join(root, file), 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (lineComment.test(line) || blockComment.test(line) || trailingComment.test(line)) {
      failures.push(`${file}:${index + 1} has a comment: ${line.trim().slice(0, 80)}`);
    }
  });
}

if (failures.length > 0) {
  console.error('style check failed: runtime files carry no comments');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('style check ok (no comments in runtime files)');
