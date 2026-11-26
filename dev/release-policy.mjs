export const breakingHeaderPattern = /^(\w*)(?:\((.*)\))?!: (.*)$/;

export const releaseRules = [
  { breaking: true, release: 'minor' },
  { revert: true, release: 'patch' },
  { type: 'feat', release: 'minor' },
  { type: 'fix', release: 'patch' },
  { type: 'perf', release: 'patch' },
  { type: 'docs', release: 'patch' },
  { type: 'chore', release: 'patch' },
  { type: 'ci', release: 'patch' },
  { type: 'test', release: 'patch' },
  { type: 'build', release: 'patch' },
  { type: 'refactor', release: 'patch' },
];

export const notesSections = {
  feat: 'Features',
  fix: 'Bug Fixes',
  perf: 'Performance Improvements',
  revert: 'Reverts',
  docs: 'Documentation',
  chore: 'Chores',
  ci: 'Continuous Integration',
  test: 'Tests',
  build: 'Build System',
  refactor: 'Code Refactoring',
  style: 'Styles',
};

export const notesTransform = (commit) => {
  const notes = (commit.notes ?? []).map((note) => ({ ...note, title: 'BREAKING CHANGES' }));
  const type = commit.revert ? 'Reverts' : notesSections[commit.type];
  if (type === undefined) return null;
  return {
    notes,
    type,
    scope: commit.scope === '*' ? '' : commit.scope,
    shortHash: typeof commit.hash === 'string' ? commit.hash.slice(0, 7) : commit.shortHash,
    subject: commit.subject,
    references: commit.references ?? [],
  };
};
