#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const failures = [];
const expect = (ok, message) => {
  if (!ok) failures.push(message);
};

const pkg = JSON.parse(read('package.json'));
const index = read('index.js');
const client = read('client.js');

const idMatch = client.match(/id:\s*'([^']+)'/);
expect(idMatch !== null, 'client.js has no module loader id');
if (idMatch !== null) {
  expect(idMatch[1] === pkg.name, `client.js id "${idMatch[1]}" does not match package name "${pkg.name}"`);
}

for (const file of ['index.js', 'client.js', 'cordis.patch.yml', 'icon.svg', 'docs']) {
  expect(pkg.files.includes(file), `package.json "files" is missing ${file}`);
}
expect(pkg.files.some((entry) => entry.startsWith('locale/')), 'package.json "files" is missing the locale files');
expect(pkg.exports?.['./client'] === './client.js', 'package.json must export ./client');

const tools = [...index.matchAll(/name:\s*'(dsh_[a-z_]+)'/g)].map((match) => match[1]);
expect(tools.length > 0, 'index.js registers no agent tools');

const docs = {
  'README.md': read('README.md'),
  'docs/DETAIL.md': read('docs/DETAIL.md'),
  'AGENTS.md': read('AGENTS.md'),
};
for (const [file, text] of Object.entries(docs)) {
  for (const match of text.matchAll(/`(dsh_[a-z_]+)`/g)) {
    expect(tools.includes(match[1]), `${file} mentions ${match[1]}, which index.js does not register`);
  }
}
for (const tool of tools) {
  expect(docs['docs/DETAIL.md'].includes(tool), `docs/DETAIL.md does not mention the ${tool} tool`);
  expect(docs['README.md'].includes(tool), `README.md does not mention the ${tool} tool`);
}

const routes = [...new Set([...index.matchAll(/'(\/dsh-update-checker\/[a-z-]+)'/g)].map((match) => match[1]))];
expect(routes.length > 0, 'index.js declares no web routes');
const security = read('SECURITY.md');
for (const route of routes) {
  expect(security.includes(route), `SECURITY.md does not mention the route ${route}`);
}

const repoUrl = String(pkg.repository?.url ?? '');
const repoMatch = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
expect(repoMatch !== null, 'package.json repository.url is not a GitHub URL');
if (repoMatch !== null) {
  const slug = `${repoMatch[1]}/${repoMatch[2]}`;
  expect(docs['README.md'].includes(slug), `README.md does not mention the repository ${slug}`);
}

const skillPath = '.agents/skills/dsh-doc/SKILL.md';
expect(fs.existsSync(path.join(root, skillPath)), `${skillPath} is missing; refresh the vendored skill`);
expect(fs.readFileSync(path.join(root, skillPath), 'utf8').includes('name: dsh-doc'), `${skillPath} lost its frontmatter`);

for (const match of docs['README.md'].matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
  const target = match[1];
  expect(fs.existsSync(path.join(root, target)), `README.md references a missing image: ${target}`);
}

const stepLabels = {
  lint: 'ESLint',
  style: 'the style check',
  'dev/docs-check.mjs': 'the docs check',
  'dev/ci-check.mjs': 'the CI check',
  unit: 'unit tests',
  test: 'the render check',
};
const checkSteps = String(pkg.scripts.check)
  .split('&&')
  .map((step) => step.trim().replace(/^npm (?:run\s+)?/, '').replace(/^node\s+(dev\/[a-z-]+\.mjs)$/, '$1'))
  .filter(Boolean);
const chainMatch = docs['README.md'].match(/`check` runs([^.]*)\./);
expect(chainMatch !== null, 'README.md does not describe what `check` runs');
const chain = chainMatch === null ? '' : chainMatch[1];
for (const step of checkSteps) {
  const label = stepLabels[step];
  expect(label !== undefined, `package.json "check" runs ${step}, and dev/docs-check.mjs has no README label for it`);
  if (label !== undefined) {
    expect(chain.includes(label), `README.md does not name the ${step} step of npm run check`);
  }
}

const mutationCount = [...read('dev/red-check.mjs').matchAll(/^    name: '/gm)].length;
const units = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const numberWord = (value) => {
  if (value < 10) return units[value];
  if (value < 20) return teens[value - 10];
  if (value < 100) return value % 10 === 0 ? tens[Math.floor(value / 10)] : `${tens[Math.floor(value / 10)]}-${units[value % 10]}`;
  return undefined;
};
const countWord = numberWord(mutationCount);
expect(countWord !== undefined, `dev/red-check.mjs has ${mutationCount} mutations, and dev/docs-check.mjs only spells numbers up to ninety-nine`);
for (const file of ['README.md', 'AGENTS.md']) {
  const claim = docs[file].match(/breaks it ([a-z-]+) ways/);
  expect(claim !== null, `${file} does not say how many ways the red check breaks the repo`);
  if (claim !== null) {
    expect(claim[1] === countWord, `${file} says the red check breaks the repo ${claim[1]} ways, dev/red-check.mjs has ${mutationCount}`);
  }
}

const bannedPunctuation = /[\u2014\u2013\u2018\u2019\u201C\u201D]/;
const prose = [];
const skipDirs = new Set(['node_modules', '.git', 'dsh-doc']);
const collect = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) collect(full);
    } else if (entry.name.endsWith('.md')) {
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (rel !== 'CHANGELOG.md') prose.push(rel);
    }
  }
};
collect(root);
for (const file of prose) {
  const lines = read(file).split('\n');
  const line = lines.findIndex((text) => bannedPunctuation.test(text));
  expect(line === -1, `${file}:${line + 1} has an em dash, an en dash, or a curly quote. Use a comma or a full stop.`);
}

if (failures.length > 0) {
  console.error('docs check failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`docs check ok (${tools.length} tools, ${routes.length} routes)`);
