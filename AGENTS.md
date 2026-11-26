# Working in this repo

## Layout

- `index.js` runs in the Host. Two web routes, two agent tools, version detection, semver comparison.
- `client.js` runs in the browser. The sidebar panel, the sidebar row icon, and the footer status. Its only import is `react` from the page module table.
- `cordis.patch.yml` is the row the bundle inserts. Its `name` must match the package name.
- `dev/` holds the checks and never ships. `render-check` renders the components, `docs-check` compares docs to code, `style-check` keeps comments out, `unit.test` covers semver, `red-check` proves the other checks catch broken code, `release-guard` blocks hand edits to versions, `commit-msg` validates messages, `install-hooks` wires git hooks.
- `.agents/skills/dsh-doc` is the DeepSeek Harness documentation skill, vendored from the installed harness. Read `.agents/skills/dsh-doc/SKILL.md` before touching slots, bundle patches, locale files, icons, or anything DSH-facing. It covers where the real docs and sources live, how a bundle patch composes, and the rules a client plugin must follow.

## DSH facts come from the skill, not from memory

The harness changes. Slot names, service methods, and bundle requirements are not guessable. Load the vendored skill, then read the installed documentation or query the live runtime. If a fact is not in the skill or the installed package, say it is unverified instead of inventing it.

## No comments in code

`index.js` and `client.js` carry no comments. They go stale and nothing checks them. Rationale belongs here or in the docs, and the code should read without narration.

## Red first

A check you have not seen fail is not a check. `npm run red` copies the repo, breaks it nine ways, and requires the matching check to fail each time.

When you add or change a check, add a mutation for it in `dev/red-check.mjs`. When you fix a bug, first make a check fail, then fix it. If nothing can fail, there is no test.

## Never

- Never run `git push`, `git remote add`, `git remote set-url`, or anything else that touches a remote. Pushing is the user's job.
- Never amend or rewrite a commit that has been pushed or shared. A local, unpushed commit can be amended to fix its own message.
- Never use `--no-verify` to skip the hooks.
- Never add a dependency without asking first.
- Never run `npm run release`, `npx semantic-release`, or `git tag`. Releases are owned by CI.
- Never hand-edit the version in `package.json` or write a CHANGELOG entry. CI owns both.

## Releases

Pushing to `main` runs semantic-release. It reads the commits since the last tag, picks the version, writes the CHANGELOG entry, bumps `package.json`, commits `chore(release): x.y.z`, tags it, and publishes a GitHub release.

- `fix:` bumps patch. `feat:` bumps minor. A `!` after the type, or a `BREAKING CHANGE:` footer, bumps major. Everything else rides along into the next release.
- Nothing is released when a push contains only `chore:`, `docs:`, `test:`, `ci:`, `build:`, or `refactor:` commits.

The tool does not judge your prefix. If you label a breaking change as `chore:`, it ships as no release at all, or worse, a patch. Label what a user would notice, not how much code you moved.

## Before committing

Run `npm run check`. It runs ESLint, the style check, the docs check, unit tests, and then renders every registered component against a stub host, so a missing variable fails here instead of leaving a blank panel.

`npm install` runs `dev/install-hooks.mjs` through the `prepare` script, so a fresh clone gets the hooks without anyone remembering a command.

The docs check compares the docs against the code: agent tool names, web route paths, the bundle id, the `files` list, and the repository slug in the README. When it fails, fix whichever side is wrong, not the check.

Commit only when the user asks.

## Docs that must stay true

`dev/docs-check.mjs` covers tool names and routes. These are on you:

- The install line in the README must match the real repository URL.
- `SECURITY.md` describes what the routes actually do. If a route starts taking input, say so there.
- `docs/DETAIL.md` is shown in Plugin Manager. No relative links, they render as plain text.
- Button labels quoted in docs are a liability. Describe the action, or check the string in `client.js` before quoting it.

## Commit messages

Conventional prefix, imperative mood, no trailing period, 72 characters max. Blank line, then bullets.

```
feat: add update checker panel

- read the latest version from registry.npmjs.org
- cache answers for 15 minutes
- expose dsh_check_update and dsh_upgrade_dsh
```

Prefixes: feat, fix, docs, chore, refactor, test, perf, build, ci.

One logical change per commit. No emoji. The `commit-msg` hook enforces this, and `dev/commit-msg.mjs` is the source of truth if this list ever disagrees with the hook.

## Things that break quietly

- The `id` in `window.__ModuleLoader__.load({ id: ... })` must equal the package name. If they drift the browser half never registers.
- `package.json` `files` must list every runtime file. `dev/` is a development tool and is not shipped.
- The CSS rule targeting `button[data-signed-out]` is deliberate. It narrows the signed-out account launcher so its hover bar stops short of the status text. Do not drop it without replacing the layout.
- Slot names and their props come from the Host. Look them up with the Cordis inspect providers instead of guessing.

## Hooks

`npm run hooks` points git at `.githooks` for this clone. There are two: `commit-msg` checks the message, `pre-commit` runs `npm run check`.

There is no push hook. Blocking pushes got in the maintainer's way, so the no-push rule is on you alone. Do not push, and do not ask for a push hook back.
