const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  fetch: 'readonly',
  AbortController: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  console: 'readonly',
};

const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  Response: 'readonly',
  URL: 'readonly',
  AbortController: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
};

const rules = {
  'no-undef': 'error',
  'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
  'no-unreachable': 'error',
  'no-dupe-keys': 'error',
  'no-const-assign': 'error',
  'no-self-assign': 'error',
  'no-unsafe-negation': 'error',
  'use-isnan': 'error',
};

const languageOptions = (globals) => ({
  ecmaVersion: 'latest',
  sourceType: 'module',
  globals,
});

export default [
  { ignores: ['node_modules/**'] },
  { files: ['client.js'], languageOptions: languageOptions(browserGlobals), rules },
  { files: ['index.js'], languageOptions: languageOptions(nodeGlobals), rules },
  { files: ['dev/**/*.mjs', 'eslint.config.js', 'release.config.js'], languageOptions: languageOptions(nodeGlobals), rules },
];
