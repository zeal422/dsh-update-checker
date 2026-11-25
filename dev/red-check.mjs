#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const mutations = [
  {
    name: 'a missing definition blanks the panel',
    file: 'client.js',
    apply: (text) => text.replace("    const codeStyle = { flex: 1, fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' };\n", ''),
    command: ['dev/render-check.mjs'],
  },
  {
    name: 'the bundle id drifts from the package name',
    file: 'client.js',
    apply: (text) => text.replace("id: '@local/dsh-update-checker'", "id: '@local/some-other-name'"),
    command: ['dev/docs-check.mjs'],
  },
  {
    name: 'an agent tool is renamed',
    file: 'index.js',
    apply: (text) => text.replace("name: 'dsh_check_update'", "name: 'dsh_check_updates'"),
    command: ['dev/docs-check.mjs'],
  },
  {
    name: 'a web route is renamed',
    file: 'index.js',
    apply: (text) => text.replace("'/dsh-update-checker/status'", "'/dsh-update-checker/ping'"),
    command: ['dev/docs-check.mjs'],
  },
  {
    name: 'a runtime file leaves the files list',
    file: 'package.json',
    apply: (text) => text.replace('    "icon.svg",\n', ''),
    command: ['dev/docs-check.mjs'],
  },
  {
    name: 'prerelease ordering breaks',
    file: 'index.js',
    apply: (text) => text.replace('  return comparePreRelease(parsedA.pre, parsedB.pre);', '  return 0;'),
    command: ['--test', 'dev/unit.test.mjs'],
  },
  {
    name: 'a comment creeps back into a runtime file',
    file: 'client.js',
    apply: (text) => text.replace('    const PANEL_ID', '    // a stale note\n    const PANEL_ID'),
    command: ['dev/style-check.mjs'],
  },
  {
    name: 'the README names the wrong repository',
    file: 'README.md',
    apply: (text) => text.replace('github:zeal422/dsh-update-checker', 'github:someone-else/dsh-update-checker'),
    command: ['dev/docs-check.mjs'],
  },
  {
    name: 'a README image points at a missing file',
    file: 'README.md',
    apply: (text) => text.replace('docs/before-sidebar.png', 'docs/before-sidebar-missing.png'),
    command: ['dev/docs-check.mjs'],
  },
];

const run = (args, cwd) => {
  try {
    execFileSync(process.execPath, args, { cwd, stdio: 'pipe' });
    return 0;
  } catch (error) {
    return error.status ?? 1;
  }
};

const results = [];

for (const mutation of mutations) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-red-'));
  try {
    fs.cpSync(repoRoot, dir, {
      recursive: true,
      filter: (source) => !/[\\/](node_modules|\.git)$/.test(source),
    });
    const target = path.join(dir, mutation.file);
    const before = fs.readFileSync(target, 'utf8');
    const after = mutation.apply(before);
    if (after === before) {
      results.push({ name: mutation.name, caught: false, reason: 'the mutation did not apply, the code moved' });
      continue;
    }
    fs.writeFileSync(target, after);
    const code = run(mutation.command, dir);
    results.push({ name: mutation.name, caught: code !== 0, reason: code === 0 ? 'the check passed on broken code' : 'caught' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

let holes = 0;
for (const result of results) {
  if (result.caught) {
    console.log(`  red   ${result.name}`);
  } else {
    holes += 1;
    console.log(`  HOLE  ${result.name} (${result.reason})`);
  }
}

if (holes > 0) {
  console.error(`\n${holes} of ${results.length} mutations went undetected. Fix the checks, not this script.`);
  process.exit(1);
}
console.log(`\nred check ok (${results.length} mutations, all caught)`);
