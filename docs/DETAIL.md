# Update checker

Adds an **Updates** panel to the sidebar. It shows the installed DSH version next to
the latest version published on npm, and upgrades when one is available.

## Use

- Open the **Updates** panel from the sidebar. Pin it to keep it visible, or find it
  in the **More** menu while it is unpinned.
- The panel checks on open and every 15 minutes. **Check again** refreshes on demand.
- When an update is available the panel offers **Upgrade to x.y.z**. Press it once to
  arm, then again to confirm. It runs the same command the manual box shows:

```sh
npm i -g @deepseek-ai/dsh@latest
```

- The upgrade prints npm's output in the panel. Restart the harness afterwards and
  reload the page to run the new version.

The sidebar row carries an amber dot on its icon while an update is available.
The sidebar foot also shows the status at the right end of the account row, reading
"Up to date" or "Update ready" with an amber dot. Selecting it opens the panel.
In the collapsed rail it shows as a plain icon.

## Agent tools

- `dsh_check_update` reports the installed version, the latest registry version, and
  whether an upgrade is available.
- `dsh_upgrade_dsh` runs the upgrade command above. Restart afterwards.

## Limitations

- The version lookup needs `https://registry.npmjs.org`. Without network access the
  panel reports the failure and keeps the manual command available.
- The upgrade runs `npm i -g`, so it needs permission to write to the global npm
  prefix. If that fails the panel prints npm's output.
- The web routes this panel uses are not behind the page's session authentication.
  Keep the server bound to loopback. The repository SECURITY.md covers this.
