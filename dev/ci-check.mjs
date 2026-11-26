#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(pathToFileURL(path.join(root, 'package.json')));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const failures = [];
const expect = (ok, message) => {
  if (!ok) failures.push(message);
};

const semverFloor = (range) => {
  const alternatives = String(range).split('||').map((part) => part.trim());
  const rows = alternatives.map((alternative) => {
    const caret = alternative.match(/^\^(\d+)\.(\d+)\.(\d+)/);
    if (caret) return { kind: 'exact', major: Number(caret[1]), minor: Number(caret[2]) };
    const gte = alternative.match(/^>=\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    if (gte) return { kind: 'gte', major: Number(gte[1]), minor: gte[2] === undefined ? null : Number(gte[2]) };
    return null;
  }).filter(Boolean);
  return rows.length > 0 ? rows : null;
};

const accepts = (rows, major, minor) => rows.some((row) => {
  if (row.kind === 'exact') return major === row.major && (minor === null || minor >= row.minor);
  const aboveFloor = major > row.major || (major === row.major && (row.minor === null || minor === null || minor >= row.minor));
  return aboveFloor;
});

const releaseConfigPath = path.join(root, 'release.config.js');
const releaseConfig = (await import(pathToFileURL(releaseConfigPath).href)).default;
expect(Array.isArray(releaseConfig?.plugins) && releaseConfig.plugins.length > 0, 'release.config.js declares no plugins');
expect(Array.isArray(releaseConfig?.branches) && releaseConfig.branches.includes('main'), 'release.config.js must release from main');

const plugins = releaseConfig?.plugins ?? [];
for (const entry of plugins) {
  const name = Array.isArray(entry) ? entry[0] : entry;
  const options = Array.isArray(entry) ? (entry[1] ?? {}) : {};
  try {
    require.resolve(name);
  } catch {
    failures.push(`release.config.js uses ${name}, which is not installed`);
  }
  if (typeof options.preset === 'string') {
    const presetPackage = `conventional-changelog-${options.preset}`;
    try {
      require.resolve(presetPackage);
    } catch {
      failures.push(`preset "${options.preset}" needs ${presetPackage}, which is not installed`);
    }
  }
}

const semanticReleaseEngines = JSON.parse(read('node_modules/semantic-release/package.json')).engines?.node;
expect(typeof semanticReleaseEngines === 'string', 'semantic-release declares no node engine');
const packageEngines = JSON.parse(read('package.json')).engines?.node;
expect(typeof packageEngines === 'string', 'package.json declares no node engine');

const workflows = ['ci', 'release'].map((name) => ({ name, text: read(`.github/workflows/${name}.yml`) }));
const versions = [];
for (const workflow of workflows) {
  const matches = [...workflow.text.matchAll(/node-version:\s*([0-9][0-9.]*)/g)].map((match) => match[1]);
  expect(matches.length > 0, `.github/workflows/${workflow.name}.yml sets no node-version`);
  for (const value of matches) versions.push({ workflow: workflow.name, value });
}

for (const { workflow, value } of versions) {
  const [majorText, minorText] = value.split('.');
  const major = Number(majorText);
  const minor = minorText === undefined ? null : Number(minorText);
  for (const [label, range] of [['semantic-release', semanticReleaseEngines], ['package.json', packageEngines]]) {
    const rows = semverFloor(range);
    expect(rows !== null, `${label} node engine "${range}" is not parsed by this check`);
    if (rows !== null) {
      expect(accepts(rows, major, minor), `workflow ${workflow} pins node ${value}, which ${label} rejects (${range})`);
    }
  }
}

const releaseWorkflow = workflows.find((workflow) => workflow.name === 'release').text;
expect(/permissions:/.test(releaseWorkflow), 'release workflow sets no permissions block');
expect(/contents:\s*write/.test(releaseWorkflow), 'release workflow needs contents: write');
expect(/GITHUB_TOKEN/.test(releaseWorkflow), 'release workflow passes no GITHUB_TOKEN');
expect(/npm ci/.test(releaseWorkflow), 'release workflow does not install from the lockfile');

const ciWorkflow = workflows.find((workflow) => workflow.name === 'ci').text;
expect(/npm run check/.test(ciWorkflow), 'CI workflow does not run npm run check');
expect(/npm run red/.test(ciWorkflow), 'CI workflow does not run the mutation check');

if (failures.length > 0) {
  console.error('ci check failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`ci check ok (${plugins.length} plugins, node ${versions.map((entry) => entry.value).join('/')})`);
