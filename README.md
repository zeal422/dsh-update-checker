# DSH update checker

A sidebar panel for DeepSeek Harness that tells you when a newer release is on npm and upgrades it without leaving the app.

## What it adds

An **Updates** row in the sidebar. It opens a panel showing the installed version, the latest version on npm, a Check again button, and an Upgrade button that only appears when something newer exists. Upgrading takes two clicks, one to arm and one to confirm.

A status line in the sidebar footer, on the same row as the account menu. It reads Up to date normally, or Update ready with an amber dot when a release is waiting.

Agent tools, so you can also ask the agent instead of clicking: `dsh_check_update` and `dsh_upgrade_dsh`.

## Install

Open Plugin Manager, choose Add plugin, then paste a git spec:

```
github:zeal422/dsh-update-checker#<40-character-commit>
```

Pin a full commit if you want Plugin Manager to offer updates later. A branch or tag installs fine, but its Update action stays disabled.

For local development, point Add plugin at the folder itself.

No harness restart is needed after install. Reload the page to load the new bundle.

## Screenshots

<!-- Add both images to docs/ and uncomment.
![The Updates panel](docs/screenshot-panel.png)
![The sidebar footer](docs/screenshot-footer.png)
-->

## How the check works

The installed version comes from the running Host's release identity. When that is missing it reads `DSH_INSTALL_DIR/package.json`.

The latest version comes from `registry.npmjs.org`. Answers are cached for 15 minutes, so clicking Check again repeatedly does not hammer the registry.

Comparison is semver including prereleases, so `0.2.2-rc.6` counts as newer than `0.2.2-rc.5`, and `0.2.3` beats `0.2.3-rc.1`.

## Limitations

The upgrade runs `npm i -g @deepseek-ai/dsh@latest`. It needs npm on PATH and write access to the global prefix. If npm fails, the panel prints its output.

A finished upgrade does not change the running process. Restart the harness and reload the page to use the new version.

The routes the panel talks to are not behind the page's session authentication. Keep the server bound to loopback. See [SECURITY.md](SECURITY.md).

One CSS rule narrows the signed-out account row so its hover bar stops before the status text. If you sign in, that row goes back to its avatar layout and the rule stops applying.

## Development

```
npm install
npm run check
```

`check` runs ESLint, the docs check, and then the render check. The render check loads the client bundle and renders every registered component against a stub host, so a missing variable fails there instead of leaving you with a blank panel. The docs check fails when a documented tool name or route no longer exists in the code, or when the bundle id drifts from the package name.

Run `npm run hooks` once per clone. It points git at `.githooks`, which checks commit messages, runs `npm run check` before committing, and refuses pushes unless `ALLOW_PUSH=1` is set. The maintainer pushes, not an agent.

## Versioning

Releases are automatic. Push to `main` and semantic-release works out the version from the commits, writes the CHANGELOG entry, bumps `package.json`, commits `chore(release): x.y.z`, tags it, and publishes a GitHub release.

- `fix:` bumps patch
- `feat:` bumps minor
- `!` after the type, or a `BREAKING CHANGE:` footer, bumps major
- `chore:`, `docs:`, `test:`, `ci:`, `build:`, `refactor:` release nothing on their own

Several commits land in one release. A push containing only internal work releases nothing at all. Nobody edits the version by hand, and the changelog is generated rather than maintained.

The catch is that the prefix is a claim. A breaking change labelled `chore:` ships as no release. Label what a user would notice.

## Commit messages

Conventional prefix plus a bullet body, enforced by the `commit-msg` hook and by CI on pull requests. See [AGENTS.md](AGENTS.md).

```
fix: keep the status pill inside the footer row

- narrow the signed-out account launcher with a scoped rule
- drop the overlay that hid the pill on hover
```

## License

MIT
