# Working in this repo

Run `node dev/render-check.mjs` before committing. It catches undefined identifiers that would blank a slot at runtime.

The `id` inside `client.js`, in `window.__ModuleLoader__.load({ id: ... })`, must equal the `package.json` name. If they drift the browser half never registers.

Slot names and their props come from the Host. Look them up with the Cordis inspect providers instead of guessing.

The CSS rule targeting `button[data-signed-out]` is deliberate. It narrows the signed-out account launcher so its hover bar stops short of the status text. Do not drop it without replacing the layout.

`package.json` `files` must list every runtime file. `dev/` is a development tool and is not shipped.
