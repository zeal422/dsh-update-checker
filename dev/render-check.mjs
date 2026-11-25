import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = fs.readFileSync(path.join(root, 'client.js'), 'utf8');
let factory;
globalThis.window = { __ModuleLoader__: { load: ({ factory: f }) => { factory = f; } } };
eval(src);

const React = {
  createElement: (type, props, ...children) => {
    if (typeof type === 'function') return type({ ...(props || {}), children });
    return { type, props, children };
  },
  useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
  useEffect: () => {},
  useRef: (v) => ({ current: v }),
  useMemo: (f) => f(),
  useCallback: (f) => f,
};
const mod = factory((name) => {
  if (name === 'react') return React;
  if (name === 'react/jsx-runtime') return { jsx: React.createElement, jsxs: React.createElement };
  throw new Error('unexpected require: ' + name);
});

const captured = [];
const ctx = {
  effect: (cb) => { cb(); return () => {}; },
  locale: { register: () => () => {}, bind: () => (k) => k },
  layout: { selectPanel: () => {} },
  slots: { inject: (name, cb) => { cb(); return () => {}; }, register: (opts, comp) => { captured.push({ opts, comp }); return () => {}; } },
};
mod.apply(ctx);
console.log('registered components:', captured.map((c) => c.opts.name + (c.opts.key ? ':' + c.opts.key : '')).join(', '));

let failures = 0;
for (const { opts, comp } of captured) {
  const props = opts.name === 'sidebar.footer.action'
    ? { wide: true, t: (k) => k, openPanel: () => {} }
    : opts.name === 'sidebar.panellist'
      ? { size: 16, active: false, t: (k) => k }
      : { t: (k) => k };
  try { comp(props); console.log('  render OK  ->', opts.name); }
  catch (e) { failures += 1; console.log('  THREW      ->', opts.name, '::', e.message); }
}

const footer = captured.find((c) => c.opts.name === 'sidebar.footer.action');
try { footer.comp({ wide: false, t: (k) => k, openPanel: () => {} }); console.log('  render OK  -> footer (rail)'); }
catch (e) { failures += 1; console.log('  THREW      -> footer (rail) ::', e.message); }

console.log(failures === 0 ? 'ALL COMPONENTS RENDER' : failures + ' FAILURE(S)');
process.exit(failures === 0 ? 0 : 1);
