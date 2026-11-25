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

if (failures.length > 0) {
  console.error('docs check failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`docs check ok (${tools.length} tools, ${routes.length} routes)`);
