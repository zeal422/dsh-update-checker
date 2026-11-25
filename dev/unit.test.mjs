import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions } from '../index.js';

test('orders patch, minor, and major releases', () => {
  assert.equal(compareVersions('1.0.0', '1.0.1'), -1);
  assert.equal(compareVersions('1.2.0', '1.10.0'), -1);
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1);
  assert.equal(compareVersions('0.2.2', '0.2.2'), 0);
});

test('ranks a prerelease below its own release', () => {
  assert.equal(compareVersions('0.2.2-rc.5', '0.2.2'), -1);
  assert.equal(compareVersions('0.2.2', '0.2.2-rc.5'), 1);
  assert.equal(compareVersions('0.2.3', '0.2.3-rc.1'), 1);
});

test('orders prerelease identifiers numerically when they are numbers', () => {
  assert.equal(compareVersions('0.2.2-rc.5', '0.2.2-rc.6'), -1);
  assert.equal(compareVersions('0.2.2-rc.9', '0.2.2-rc.10'), -1);
  assert.equal(compareVersions('0.2.2-rc.10', '0.2.2-rc.9'), 1);
});

test('falls back to text order for tags that are not semver', () => {
  assert.equal(compareVersions('build-b', 'build-a'), 1);
  assert.equal(compareVersions('unknown', 'unknown'), 0);
});
