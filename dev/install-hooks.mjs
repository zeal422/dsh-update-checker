#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

if (process.env.CI) {
  console.log('hooks: CI run, skipping');
  process.exit(0);
}

if (!fs.existsSync(path.join(root, '.git'))) {
  console.log('hooks: not a git checkout, skipping');
  process.exit(0);
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: root, stdio: 'pipe' });
  console.log('hooks: core.hooksPath -> .githooks');
} catch (error) {
  console.error(`hooks: could not set core.hooksPath (${error.message})`);
  process.exit(1);
}
