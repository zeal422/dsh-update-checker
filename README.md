# DSH update checker

A sidebar panel for DeepSeek Harness that tells you when a newer release is on npm and upgrades it without leaving the app.

## What it adds

An **Updates** row in the sidebar. It opens a panel showing the installed version, the latest version on npm, a Check again button, and an Upgrade button that only appears when something newer exists.

A status line in the sidebar footer, on the same row as the account menu. It reads Up to date normally, or Update ready with an amber dot when a release is waiting.

Two agent tools, so you can also ask the agent instead of clicking: `dsh_check_update` and `dsh_upgrade_dsh`.

## Install

Open Plugin Manager, choose Add plugin, then paste a git spec:

```
github:zeal422/dsh-update-checker#<40-character-commit>
```

Pin a full commit if you want Plugin Manager to offer updates later. A branch or tag installs fine, but its Update action stays disabled.

For local development, point Add plugin at the folder itself.

No restart is needed after install. The bundle activates through hot reload.

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

`check` runs ESLint and then the render check. The render check loads the client bundle and renders every registered component against a stub host, so a missing variable fails there instead of leaving you with a blank panel.

Run `npm run hooks` once per clone. It points git at `.githooks`, which checks commit messages, runs `npm run check` before committing, and refuses pushes unless `ALLOW_PUSH=1` is set. The maintainer pushes, not an agent.

## Commit messages

Conventional prefix plus a bullet body, enforced by the `commit-msg` hook and by CI on pull requests. See [AGENTS.md](AGENTS.md).

```
fix: keep the status pill inside the footer row

- narrow the signed-out account launcher with a scoped rule
- drop the overlay that hid the pill on hover
```

## License

MIT
