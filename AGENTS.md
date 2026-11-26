# Working in this repo

## Layout

- `index.js` runs in the Host. Two web routes, two agent tools, version detection, semver comparison.
- `client.js` runs in the browser. The sidebar panel, the sidebar row icon, and the footer status. Its only import is `react` from the page module table.
- `cordis.patch.yml` is the row the bundle inserts. Its `name` must match the package name.
- `dev/` holds the checks and never ships. `render-check` renders the components, `docs-check` compares docs to code and keeps punctuation clean, `style-check` keeps comments out, `ci-check` validates the release config and workflows, `sync-check` refuses a commit while the branch is behind its upstream, `release-policy` holds the release rules and changelog sections, `unit.test` covers semver, `sync.test` covers the sync guard, `red-check` proves the other checks catch broken code, `release-guard` blocks hand edits to versions, `commit-msg` validates messages, `install-hooks` wires git hooks.
- `.agents/skills/dsh-doc` is the DeepSeek Harness documentation skill, vendored from the installed harness. Read `.agents/skills/dsh-doc/SKILL.md` before touching slots, bundle patches, locale files, icons, or anything DSH-facing. It covers where the real docs and sources live, how a bundle patch composes, and the rules a client plugin must follow.

## DSH facts come from the skill, not from memory

The harness changes. Slot names, service methods, and bundle requirements are not guessable. Load the vendored skill, then read the installed documentation or query the live runtime. If a fact is not in the skill or the installed package, say it is unverified instead of inventing it.

## No comments in code

`index.js` and `client.js` carry no comments. They go stale and nothing checks them. Rationale belongs here or in the docs, and the code should read without narration.

## Writing

No em dashes. No en dashes standing in for them. No parentheses to dodge one. A comma or a full stop does the job. `dev/docs-check.mjs` fails on an em dash, an en dash, or a curly quote in hand-written markdown.

Sentence case headings. Straight quotes. No bold label that restates the line under it. No "not just X but Y". Do not force three of anything. No "Great question", no "I hope this helps", no "Let me know if".

Say what happened, who did it, and the number. Short sentences are fine, and so are long ones that earn their length. Hold an opinion when the facts support one. The `unslop` skill has the full list if it is installed.

## Claims

- Never say fixed, working, verified, or done unless you ran it and read the result. Quote the command and the output.
- Never say "should work". Say "unverified" and name what is missing. A guess presented as a fact is the failure this section exists to prevent.
- When something cannot be confirmed, exhaust every way to confirm it before assuming. Install the missing runtime, point the tool at a local stand-in, read the source, call the API. If it is still impossible, say exactly what blocked it, not that it probably works.
- Read the actual error before changing anything. Reproduce the failure first. Do not edit config on a hunch, and do not fix the first plausible cause you find.
- After changing CI or a workflow, read the run result and its annotations. A push is not evidence.
- Separate verified by me, verified by the user, and not verified, every single time. Say which one it is.
- The render harness proves a component does not crash. It does not prove it looks right. Never claim how something looks without a screenshot.
- When the user challenges a claim, answer with evidence or retract it. Never repeat a claim after contrary evidence has been shown.
- If you catch yourself writing "probably", "should be fine", or "that was the issue", stop and run the check instead.

## Sync before you judge the repo

CI commits to the remote. Nothing pulls those commits into this clone. A checkout that has not fetched shows an old version and an old CHANGELOG, and calling that file stale is wrong. The file is fine. The clone is behind.

Run this before any audit, doc claim, version claim, or commit:

```sh
git fetch origin
git status -sb
```

If it says `behind`, rebase first:

```sh
git rebase --autostash @{u}
```

The `pre-commit` hook runs `dev/sync-check.mjs`, which fetches and refuses the commit while the branch is behind its upstream. When the branch has no upstream, or the fetch fails, it prints a skip line and lets the commit through.

The remote is the truth. A local checkout that disagrees with it is out of date, not evidence.

## Red first

A check you have not seen fail is not a check. `npm run red` copies the repo, breaks it twenty-three ways, and requires the matching check to fail each time.

When you add or change a check, add a mutation for it in `dev/red-check.mjs`. When you fix a bug, first make a check fail, then fix it. If nothing can fail, there is no test.

## Never

- Never run `git push`, `git remote add`, `git remote set-url`, or anything else that touches a remote. Pushing is the user's job.
- Never amend or rewrite a commit that has been pushed or shared. A local, unpushed commit can be amended to fix its own message.
- Never use `--no-verify` to skip the hooks.
- Never add a dependency without asking first.
- Never run `npm run release`, `npx semantic-release`, or `git tag`. Releases are owned by CI.
- Never hand-edit the version in `package.json` or write a CHANGELOG entry. CI owns both.

## Releases

Pushing to `main` runs semantic-release. It reads the commits since the last tag, picks the version, writes the CHANGELOG entry, bumps `package.json` and `package-lock.json`, commits `chore(release): x.y.z`, tags it, and publishes a GitHub release.

- Every push releases. `feat:` bumps the minor number, the second one. Every other prefix bumps the patch number, the third one.
- The major number stays at 1 until the maintainer says otherwise. No commit changes it.
- A `!` after the type, or a `BREAKING CHANGE:` footer, releases as a minor and lands under BREAKING CHANGES. It never bumps the major.
- One push produces one version, not one version per commit.
- The changelog and the release notes list every type, including docs and chores.

The tool does not judge your prefix. If you label a breaking change as `chore:`, it ships as a patch and reads like a chore. Label what a user would notice, not how much code you moved.

## Before committing

Run `npm run check`. It runs ESLint, the style check, the docs check, the CI check, unit tests, and then renders every registered component against a stub host, so a missing variable fails here instead of leaving a blank panel.

`npm install` runs `dev/install-hooks.mjs` through the `prepare` script, so a fresh clone gets the hooks without anyone remembering a command.

The docs check compares the docs against the code: agent tool names, web route paths, the bundle id, the `files` list, the repository slug in the README, the check steps and mutation count that this file and the README quote, and em dashes or curly quotes in hand-written markdown.

The CI check catches the two failures this repo already had: a release plugin or preset that is not installed, and a workflow node version that semantic-release rejects. It also requires `contents: write`, a `GITHUB_TOKEN`, `npm ci`, and the full check chain in the workflows. It enforces the version policy too: every prefix has a release rule, feat is minor, nothing bumps the major, every type survives into the changelog, and `package-lock.json` stays on the same version as `package.json`.

When either check fails, fix whichever side is wrong, not the check.

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

`npm run hooks` points git at `.githooks` for this clone. There are two: `commit-msg` checks the message, `pre-commit` runs `dev/sync-check.mjs` and then `npm run check`.

There is no push hook. Blocking pushes got in the maintainer's way, so the no-push rule is on you alone. Do not push, and do not ask for a push hook back.
