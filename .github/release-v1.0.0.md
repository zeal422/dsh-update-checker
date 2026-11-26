Watches npm for a newer DeepSeek Harness and upgrades it without leaving the app.

## Highlights

- Updates row in the sidebar, showing the installed and latest versions
- Two-step upgrade that runs `npm i -g @deepseek-ai/dsh@latest` and prints npm's output
- Status next to the account row, so "Update ready" is visible without opening the panel
- Agent tools `dsh_check_update` and `dsh_upgrade_dsh`
- English and Chinese strings
- No runtime dependencies: the Host half uses Node builtins, the browser half reuses the page's React

## Notes

- The web routes sit outside the page session auth, so keep the server bound to loopback
- A finished upgrade needs a harness restart and a page reload
