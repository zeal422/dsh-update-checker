# Working in this repo

## Never

- Never run `git push`, `git remote add`, `git remote set-url`, or anything else that touches a remote. Pushing is the user's job.
- Never amend or rewrite a commit that already exists on a branch.
- Never use `--no-verify` to skip the hooks.
- Never add a dependency without asking first.
- Never bump the version or edit CHANGELOG.md unless asked.

## Before committing

Run `npm run check`. It lints both halves and renders every registered component against a stub host, so a missing variable fails here instead of leaving a blank panel.

Commit only when the user asks.

## Commit messages

Conventional prefix, imperative mood, no trailing period, 72 characters max. Blank line, then bullets.

```
feat: add update checker panel

- read the latest version from registry.npmjs.org
- cache answers for 15 minutes
- expose dsh_check_update and dsh_upgrade_dsh
```

Prefixes: feat, fix, docs, chore, refactor, test, perf, build, ci.

One logical change per commit. No emoji. The `commit-msg` hook enforces this.

## Things that break quietly

- The `id` in `window.__ModuleLoader__.load({ id: ... })` must equal the package name. If they drift the browser half never registers.
- `package.json` `files` must list every runtime file. `dev/` is a development tool and is not shipped.
- The CSS rule targeting `button[data-signed-out]` is deliberate. It narrows the signed-out account launcher so its hover bar stops short of the status text. Do not drop it without replacing the layout.
- Slot names and their props come from the Host. Look them up with the Cordis inspect providers instead of guessing.

## Hooks

`npm run hooks` points git at `.githooks` for this clone. `pre-push` refuses unless `ALLOW_PUSH=1` is set.
