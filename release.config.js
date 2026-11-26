import { breakingHeaderPattern, notesTransform, releaseRules } from './dev/release-policy.mjs';

export default {
  branches: ['main'],
  plugins: [
    ['@semantic-release/commit-analyzer', { releaseRules, parserOpts: { breakingHeaderPattern } }],
    ['@semantic-release/release-notes-generator', { writerOpts: { transform: notesTransform }, parserOpts: { breakingHeaderPattern } }],
    ['@semantic-release/npm', { npmPublish: false }],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
  ],
};
