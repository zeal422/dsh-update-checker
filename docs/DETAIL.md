# Update checker

Adds an **Updates** panel to the sidebar. It shows the installed DSH version next to
the latest version published on npm, and upgrades when one is available.

## Use

- Open the **Updates** panel from the sidebar (pin it to keep it visible, or find it
  in the **More** menu while it is unpinned).
- The panel checks automatically on open and every 15 minutes; **Check again**
  refreshes on demand.
- When an update is available, either press **Upgrade now** or run the manual command:

```sh
npm i -g @deepseek-ai/dsh@latest
```

- After a successful upgrade, restart the harness and reload this page to run the
  new version.

The sidebar row carries an amber dot on its icon while an update is available.
The sidebar foot also shows the status tucked at the right end of the account row
("Up to date", or "Update ready" with an amber dot); selecting it opens the panel.
In the collapsed rail it shows as a plain icon instead.

## Agent tools

- `dsh_check_update` — returns installed version, latest registry version, and
  whether an upgrade is available.
- `dsh_upgrade_dsh` — runs the upgrade command above; restart afterwards.

## Limitations

- The latest-version lookup needs access to `https://registry.npmjs.org`. Without
  network access the panel reports the failure and still shows the manual command.
- **Upgrade now** runs `npm i -g`, so it needs permission to write to the global
  npm prefix. If that fails, the panel shows npm's output and you can run the
  command in a terminal with the rights it needs.
