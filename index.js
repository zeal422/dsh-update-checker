import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';

const PKG = '@deepseek-ai/dsh';
const INSTALL_SPEC = `${PKG}@latest`;
const UPGRADE_CMD = `npm i -g ${INSTALL_SPEC}`;
const REGISTRY_URL = 'https://registry.npmjs.org/@deepseek-ai%2Fdsh/latest';
const STATUS_PATH = '/dsh-update-checker/status';
const UPGRADE_PATH = '/dsh-update-checker/upgrade';
const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

const requireFromHere = createRequire(import.meta.url);

let latestCache = { at: 0, version: null, error: null };

function readInstalledVersion(ctx) {
  try {
    const release = ctx.get('clientModules')?.graph?.()?.release;
    if (release && typeof release.version === 'string' && release.version.length > 0) {
      return release.version;
    }
  } catch {
  }
  const candidates = [];
  if (typeof process.env.DSH_INSTALL_DIR === 'string' && process.env.DSH_INSTALL_DIR.length > 0) {
    candidates.push(path.join(process.env.DSH_INSTALL_DIR, 'package.json'));
  }
  try {
    candidates.push(path.join(path.dirname(requireFromHere.resolve(`${PKG}/package.json`)), 'package.json'));
  } catch {
  }
  for (const file of candidates) {
    try {
      const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (manifest && typeof manifest.version === 'string' && manifest.version.length > 0) {
        return manifest.version;
      }
    } catch {
    }
  }
  return 'unknown';
}

function parseVersion(value) {
  const match = String(value).trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.+)?$/);
  if (!match) return null;
  return { numbers: [Number(match[1]), Number(match[2]), Number(match[3])], pre: match[4] ?? null };
}

function comparePreRelease(a, b) {
  if (a === b) return 0;
  if (a === null) return 1;  if (b === null) return -1;
  const aParts = a.split('.');
  const bParts = b.split('.');
  const length = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < length; i += 1) {
    const aPart = aParts[i];
    const bPart = bParts[i];
    if (aPart === bPart) continue;
    if (aPart === undefined) return -1;
    if (bPart === undefined) return 1;
    const aNum = /^\d+$/.test(aPart) ? Number(aPart) : null;
    const bNum = /^\d+$/.test(bPart) ? Number(bPart) : null;
    if (aNum !== null && bNum !== null) {
      if (aNum !== bNum) return aNum < bNum ? -1 : 1;
    } else if (aNum !== null) {
      return -1;    } else if (bNum !== null) {
      return 1;
    } else if (aPart !== bPart) {
      return aPart < bPart ? -1 : 1;
    }
  }
  return 0;
}

function compareVersions(a, b) {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);
  if (!parsedA || !parsedB) {
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }
  for (let i = 0; i < 3; i += 1) {
    if (parsedA.numbers[i] !== parsedB.numbers[i]) {
      return parsedA.numbers[i] < parsedB.numbers[i] ? -1 : 1;
    }
  }
  return comparePreRelease(parsedA.pre, parsedB.pre);
}

async function fetchJson(url, signal, timeoutMs) {
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal?.reason);
  let timer;
  try {
    if (signal) {
      if (signal.aborted) controller.abort(signal.reason);
      else signal.addEventListener('abort', onAbort, { once: true });
    }
    timer = setTimeout(() => controller.abort(new Error('Registry request timed out')), timeoutMs);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Registry answered HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onAbort);
  }
}

async function getStatus(ctx, signal) {
  const current = readInstalledVersion(ctx);
  let { version, error } = latestCache;
  if (Date.now() - latestCache.at >= CACHE_TTL_MS || version === null) {
    try {
      const payload = await fetchJson(REGISTRY_URL, signal, FETCH_TIMEOUT_MS);
      if (!payload || typeof payload.version !== 'string') {
        throw new Error('Registry answer carried no version');
      }
      version = payload.version;
      error = null;
      latestCache = { at: Date.now(), version, error };
    } catch (fetchError) {
      error = fetchError?.message ? String(fetchError.message) : String(fetchError);
      if (latestCache.version !== null) {
        version = latestCache.version;
      } else {
        latestCache = { at: 0, version: null, error };
      }
    }
  }
  const updateAvailable =
    version !== null && current !== 'unknown' ? compareVersions(current, version) < 0 : false;
  return {
    current,
    latest: version,
    updateAvailable,
    checkedAt: new Date().toISOString(),
    error,
  };
}

function tailText(value, max) {
  const text = String(value ?? '');
  if (text.length <= max) return text;
  return `…${text.slice(-max)}`;
}

function runNpmUpgrade(signal) {
  return new Promise((resolve) => {
    execFile(
      'npm',
      ['i', '-g', INSTALL_SPEC],
      { timeout: 5 * 60 * 1000, maxBuffer: 4 * 1024 * 1024, signal },
      (error, stdout, stderr) => {
        if (error && (error.name === 'AbortError' || error.code === 'ABORT_ERR')) {
          resolve({ success: false, code: null, output: '', error: 'Upgrade was cancelled.' });
          return;
        }
        const code = typeof error?.code === 'number' ? error.code : error ? 1 : 0;
        resolve({
          success: code === 0,
          code,
          output: tailText(`${stdout ?? ''}${stderr ?? ''}`.trim(), 4000),
          error: code === 0 ? null : tailText(error?.message ?? 'npm exited with an error', 500),
        });
      },
    );
  });
}

function summarizeStatus(value) {
  if (value.error && !value.latest) {
    return `Could not reach the npm registry (${value.error}). Installed version: ${value.current}.`;
  }
  if (value.updateAvailable) {
    return `Update available: installed ${value.current}, latest ${value.latest}. Run \`${UPGRADE_CMD}\` and restart the harness.`;
  }
  if (value.latest) {
    return `DSH is up to date (installed and latest: ${value.current}).`;
  }
  return `Installed version: ${value.current}. Latest registry version is unknown.`;
}

function registerStatusResource(webServer, ctx) {
  return webServer.register({
    kind: 'exact',
    path: STATUS_PATH,
    resource: async () => {
      try {
        return Response.json(await getStatus(ctx));
      } catch (error) {
        return Response.json(
          { error: error?.message ? String(error.message) : String(error) },
          { status: 500 },
        );
      }
    },
  });
}

function registerUpgradeRoute(webServer, ctx) {
  return webServer.register({
    kind: 'exact',
    path: UPGRADE_PATH,
    handler: async (req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(405, { 'content-type': 'application/json', allow: 'POST' });
        res.end(JSON.stringify({ success: false, error: 'Use POST to start the upgrade.' }));
        return;
      }
      await new Promise((resolve) => {
        req.resume();
        req.on('end', resolve);
        req.on('error', resolve);
      });
      try {
        const before = await getStatus(ctx);
        const upgrade = await runNpmUpgrade();
        if (upgrade.success) latestCache = { at: Date.now(), version: before.latest, error: null };
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ...upgrade, current: before.current, latest: before.latest }));
      } catch (error) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: String(error?.message ?? error) }));
      }
    },
  });
}

export function apply(ctx) {
  const tools = ctx.get('tools');
  if (tools) {
    ctx.effect(
      () =>
        tools.register({
          name: 'dsh_check_update',
          description:
            'Check whether a newer @deepseek-ai/dsh release is published on npm. Returns the installed version, the latest registry version, and whether an upgrade is available. Takes no arguments.',
          parameters: { type: 'object', properties: {}, additionalProperties: false },
          output: {
            schema: {
              type: 'object',
              properties: {
                current: { type: 'string' },
                latest: { oneOf: [{ type: 'string' }, { type: 'null' }] },
                updateAvailable: { type: 'boolean' },
                checkedAt: { type: 'string' },
                error: { oneOf: [{ type: 'string' }, { type: 'null' }] },
              },
              required: ['current', 'updateAvailable', 'checkedAt'],
              additionalProperties: true,
            },
            render(_args, value) {
              return [{ type: 'text', text: summarizeStatus(value) }];
            },
          },
          async execute(_args, exec) {
            return getStatus(ctx, exec.signal);
          },
        }),
      'dsh-update-checker: check tool',
    );
    ctx.effect(
      () =>
        tools.register({
          name: 'dsh_upgrade_dsh',
          description: `Upgrade the DeepSeek Harness by running \`${UPGRADE_CMD}\`. Use after dsh_check_update reports an available update, or when the user explicitly asks to upgrade. Takes no arguments; restart the harness afterwards to run the new version.`,
          parameters: { type: 'object', properties: {}, additionalProperties: false },
          output: {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                code: { oneOf: [{ type: 'number' }, { type: 'null' }] },
                current: { type: 'string' },
                latest: { oneOf: [{ type: 'string' }, { type: 'null' }] },
                output: { type: 'string' },
                error: { oneOf: [{ type: 'string' }, { type: 'null' }] },
              },
              required: ['success', 'output'],
              additionalProperties: true,
            },
            render(_args, value) {
              if (value.success) {
                return [
                  {
                    type: 'text',
                    text: `Upgrade finished (installed ${value.current}, registry ${value.latest}). Restart the harness to run the new version.`,
                  },
                ];
              }
              return [{ type: 'text', text: `Upgrade failed: ${value.error ?? 'unknown error'}` }];
            },
          },
          async execute(_args, exec) {
            const before = await getStatus(ctx, exec.signal);
            const upgrade = await runNpmUpgrade(exec.signal);
            return { ...upgrade, current: before.current, latest: before.latest };
          },
        }),
      'dsh-update-checker: upgrade tool',
    );
  }

  const webServer = ctx.get('webServer');
  if (webServer) {
    ctx.effect(() => registerStatusResource(webServer, ctx), 'dsh-update-checker: status route');
    ctx.effect(() => registerUpgradeRoute(webServer, ctx), 'dsh-update-checker: upgrade route');
  }
}

export { compareVersions };
