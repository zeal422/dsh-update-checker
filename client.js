window.__ModuleLoader__.load({
  id: '@local/dsh-update-checker',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PANEL_ID = 'dsh-updates';
    const NS = 'dshUpdateChecker';
    const STATUS_URL = '/dsh-update-checker/status';
    const UPGRADE_URL = '/dsh-update-checker/upgrade';
    const UPGRADE_CMD = 'npm i -g @deepseek-ai/dsh@latest';
    const REFRESH_MS = 15 * 60 * 1000;

    const en = {
      panel: 'Updates',
      title: 'Updates',
      intro: 'Check whether a newer DeepSeek Harness release is published, and upgrade when one is available.',
      installed: 'Installed',
      latest: 'Latest',
      upToDate: 'Up to date',
      updateAvailable: 'Update available',
      checking: 'Checking…',
      checkAgain: 'Check again',
      copyCommand: 'Copy upgrade command',
      copied: 'Copied',
      upgradeNow: 'Upgrade now',
      upgrading: 'Upgrading…',
      upgradeDone: 'Upgrade finished. Restart the harness to run the new version.',
      upgradeFailed: 'Upgrade failed.',
      restartNote: 'After a successful upgrade, restart the harness (and reload this page) to run the new version.',
      registryError: 'Could not reach the npm registry. You can still upgrade manually:',
      openPanel: 'Open Updates',
      commandLabel: 'Manual upgrade command',
      resultLabel: 'Upgrade output',
      upToDateShort: 'Up to date',
      updateAvailableShort: 'Update ready',
      unknown: 'unknown',
      errorShort: 'Error',
      confirmUpgrade: 'Click again to confirm',
      upgradeTo: 'Upgrade to {version}',
    };
    const zh = {
      panel: '更新',
      title: '更新',
      intro: '检查是否有新发布的 DeepSeek Harness 版本，并在可用时升级。',
      installed: '已安装',
      latest: '最新',
      upToDate: '已是最新',
      updateAvailable: '有可用更新',
      checking: '检查中…',
      checkAgain: '重新检查',
      copyCommand: '复制升级命令',
      copied: '已复制',
      upgradeNow: '立即升级',
      upgrading: '升级中…',
      upgradeDone: '升级完成。请重启 Harness 以运行新版本。',
      upgradeFailed: '升级失败。',
      restartNote: '升级成功后请重启 Harness（并重新加载本页面）以运行新版本。',
      registryError: '无法访问 npm 仓库，你仍可手动升级：',
      openPanel: '打开更新面板',
      commandLabel: '手动升级命令',
      resultLabel: '升级输出',
      upToDateShort: '已是最新',
      updateAvailableShort: '有更新',
      unknown: '未知',
      errorShort: '出错',
      confirmUpgrade: '再次点击确认升级',
      upgradeTo: '升级到 {version}',
    };

    function useStatus(tick) {
      const [state, setState] = React.useState({ phase: 'checking', status: null, error: null });
      React.useEffect(() => {
        let alive = true;
        const controller = new AbortController();
        setState({ phase: 'checking', status: null, error: null });
        fetch(STATUS_URL, { signal: controller.signal, headers: { accept: 'application/json' } })
          .then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          })
          .then((status) => {
            if (alive) setState({ phase: 'done', status, error: null });
          })
          .catch((err) => {
            if (!alive || (err && err.name === 'AbortError')) return;
            setState({ phase: 'error', status: null, error: String((err && err.message) || err) });
          });
        return () => {
          alive = false;
          controller.abort();
        };
      }, [tick]);
      return state;
    }

    function fallbackCopy(done) {
      try {
        const el = document.createElement('textarea');
        el.value = UPGRADE_CMD;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        done();
      } catch (err) {
        // Clipboard unavailable; the command stays visible for manual copy.
      }
    }

    const containerStyle = {
      maxWidth: 720, margin: '0 auto', padding: '24px 20px 40px',
      minHeight: '100%', flex: '1 1 auto', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      color: 'var(--dsw-alias-label-primary)', font: 'inherit', lineHeight: 1.5,
    };
    const headingStyle = { fontSize: 20, fontWeight: 650, margin: '0 0 6px' };
    const subStyle = { fontSize: 13, color: 'var(--dsw-alias-label-secondary)', margin: '0 0 8px' };
    const sectionStyle = { padding: '14px 0', borderTop: '1px solid var(--dsw-alias-border-l1)' };
    const rowStyle = { display: 'flex', alignItems: 'baseline', gap: 12, padding: '5px 0' };
    const rowLabelStyle = {
      fontSize: 13, color: 'var(--dsw-alias-label-secondary)', margin: 0, width: 150, flex: 'none',
    };
    const rowValueStyle = { fontSize: 14, fontWeight: 600, margin: 0, wordBreak: 'break-all' };
    const pillBase = {
      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
    };
    const buttonRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 };
    function buttonStyle(primary) {
      return {
        font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        borderRadius: 8, padding: '9px 14px 5px',
        color: primary ? 'var(--dsw-alias-bg-base)' : 'var(--dsw-alias-label-primary)',
        opacity: 1,
      };
    }
    const noteStyle = { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', margin: '12px 0 0' };
    const codeStyle = { flex: 1, fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' };
    // Our own control chrome plus one scoped shell rule: the signed-out account
    // launcher (the "More" row) is declared width:100%, so its hover fill spans
    // the whole row. Narrowing that one button makes the highlight hug its
    // content and frees the row's right end for this plugin's status text.
    // Scoped by the launcher's own data attributes; removed when we unmount.
    const SHELL_CSS = '.dshuc-btn{background:transparent;border:1px solid var(--dsw-alias-border-l2);'
      + 'transition:background-color 120ms ease,border-color 120ms ease,transform 60ms ease}'
      + '.dshuc-btn:hover:not(:disabled){background-color:var(--dsw-alias-interactive-bg-hover);'
      + 'border-color:var(--dsw-alias-border-l1)}'
      + '.dshuc-btn:active:not(:disabled){background-color:var(--dsw-alias-interactive-bg-active);'
      + 'transform:translateY(1px)}'
      + '.dshuc-btn:disabled{opacity:.55;cursor:default}'
      + '.dshuc-btn:focus-visible,.dshuc-foot:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}'
      + 'button[data-signed-out="true"]:not([data-collapsed="true"]){width:auto!important}'
      + '.dshuc-foot{background:transparent;transition:background-color 120ms}'
      + '.dshuc-foot:hover{background-color:var(--dsw-alias-interactive-bg-hover)}';
    const preStyle = {
      fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      margin: '8px 0 0', padding: '8px 0 0', borderTop: '1px solid var(--dsw-alias-border-l1)',
      maxHeight: 220, overflow: 'auto',
    };

    function pillFor(phase, status, t) {
      if (phase === 'checking') {
        return h('span', { style: { ...pillBase, color: 'var(--dsw-alias-label-secondary)' } }, t('checking'));
      }
      if (phase === 'error' || !status) {
        return h('span', { style: { ...pillBase, color: 'var(--dsw-alias-state-error-primary)' } }, t('errorShort'));
      }
      if (status.updateAvailable) {
        return h('span', { style: { ...pillBase, color: 'var(--dsw-alias-state-warn-primary)' } }, t('updateAvailable'));
      }
      return h('span', { style: { ...pillBase, color: 'var(--dsw-alias-state-success-primary)' } }, t('upToDate'));
    }

    function UpdateIcon(props) {
      const size = props.size || 16;
      const [update, setUpdate] = React.useState(false);
      React.useEffect(() => {
        let alive = true;
        const controller = new AbortController();
        fetch(STATUS_URL, { signal: controller.signal, headers: { accept: 'application/json' } })
          .then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          })
          .then((s) => {
            if (alive) setUpdate(!!(s && s.updateAvailable));
          })
          .catch(() => {});
        return () => {
          alive = false;
          controller.abort();
        };
      }, []);
      return h(
        'span',
        { style: { position: 'relative', display: 'inline-flex', width: size, height: size } },
        h(
          'svg',
          { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true, style: { display: 'block' } },
          h('path', {
            d: 'M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M3 12.5h10',
            stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
          }),
        ),
        update
          ? h('span', {
            'aria-hidden': true,
            style: {
              position: 'absolute', top: -3, right: -3, width: 9, height: 9,
              borderRadius: '50%', background: 'var(--dsw-alias-state-warn-primary)',
            },
          })
          : null,
      );
    }

    function CommandBox(props) {
      const t = props.t;
      const [copied, setCopied] = React.useState(false);
      function copy() {
        const done = () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(UPGRADE_CMD).then(done, () => fallbackCopy(done));
        } else {
          fallbackCopy(done);
        }
      }
      return h(
        'div',
        null,
        h('p', { style: { ...rowLabelStyle, width: 'auto', margin: '0 0 6px' } }, t('commandLabel')),
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 12 } },
          h('code', { style: codeStyle }, UPGRADE_CMD),
          h(
            'button',
            { type: 'button', className: 'dshuc-btn', style: { ...buttonStyle(false), minWidth: 160, textAlign: 'center', flex: 'none', marginRight: -14 }, onClick: copy },
            copied ? t('copied') : t('copyCommand'),
          ),
        ),
      );
    }

    function UpdatePanel(props) {
      const t = props.t || ((key) => (en[key] !== undefined ? en[key] : key));
      const [tick, setTick] = React.useState(0);
      const { phase, status, error } = useStatus(tick);
      const [lastStatus, setLastStatus] = React.useState(null);
      const [upgrading, setUpgrading] = React.useState(false);
      const [armed, setArmed] = React.useState(false);
      const [upgradeResult, setUpgradeResult] = React.useState(null);
      const upgradingRef = React.useRef(false);

      React.useEffect(() => {
        if (phase === 'done' && status) setLastStatus(status);
      }, [phase, status]);

      React.useEffect(() => {
        const id = setInterval(() => {
          if (!upgradingRef.current) {
            setArmed(false);
            setTick((n) => n + 1);
          }
        }, REFRESH_MS);
        return () => clearInterval(id);
      }, []);

      function refresh() {
        setArmed(false);
        setUpgradeResult(null);
        setTick((n) => n + 1);
      }

      function startUpgrade() {
        setUpgrading(true);
        upgradingRef.current = true;
        setUpgradeResult(null);
        fetch(UPGRADE_URL, { method: 'POST' })
          .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
          .then(({ ok, body }) => {
            setUpgrading(false);
            upgradingRef.current = false;
            setArmed(false);
            const success = ok && body && body.success;
            setUpgradeResult({
              success,
              message: success ? t('upgradeDone') : (body && body.error) || t('upgradeFailed'),
              output: body && body.output ? body.output : '',
            });
            setTick((n) => n + 1);
          })
          .catch((err) => {
            setUpgrading(false);
            upgradingRef.current = false;
            setArmed(false);
            setUpgradeResult({ success: false, message: String((err && err.message) || err), output: '' });
          });
      }

      function onUpgradeClick() {
        if (upgrading) return;
        if (!armed) {
          setArmed(true);
          setTimeout(() => setArmed(false), 6000);
          return;
        }
        startUpgrade();
      }

      const shown = status || lastStatus;
      const showUpgrade = !!(shown && shown.updateAvailable);
      const upgradeLabel = upgrading
        ? t('upgrading')
        : armed
          ? t('confirmUpgrade')
          : shown && shown.latest
            ? t('upgradeTo').replace('{version}', shown.latest)
            : t('upgradeNow');

      return h(
        'div',
        { style: containerStyle },
        h('style', null, SHELL_CSS),
        h('h1', { style: headingStyle }, t('title')),
        h('p', { style: subStyle }, t('intro')),
        h('div', { style: { margin: '4px 0 2px' } }, pillFor(phase, status || lastStatus, t)),
        shown
          ? h(
            'div',
            { style: sectionStyle },
            h(
              'div',
              { style: rowStyle },
              h('p', { style: rowLabelStyle }, t('installed')),
              h('p', { style: rowValueStyle }, shown.current || t('unknown')),
            ),
            h(
              'div',
              { style: rowStyle },
              h('p', { style: rowLabelStyle }, t('latest')),
              h('p', { style: rowValueStyle }, shown.latest || t('unknown')),
            ),
          )
          : null,
        phase === 'error' && !shown
          ? h('p', { style: noteStyle, role: 'alert' }, error || t('registryError'))
          : null,
        h(
          'div',
          { style: sectionStyle },
          h(
            'div',
            { style: { ...buttonRowStyle, marginTop: 0 } },
            h(
              'button',
              {
                type: 'button', className: 'dshuc-btn',
                style: { ...buttonStyle(false), marginLeft: -14 },
                onClick: refresh, disabled: phase === 'checking' || upgrading,
              },
              t('checkAgain'),
            ),
            showUpgrade
              ? h(
                'button',
                {
                  type: 'button', className: 'dshuc-btn', style: buttonStyle(false),
                  onClick: onUpgradeClick, disabled: upgrading,
                },
                upgradeLabel,
              )
              : null,
          ),
          upgradeResult
            ? h(
              'div',
              { style: { marginTop: 12 } },
              h(
                'p',
                {
                  style: {
                    ...noteStyle,
                    margin: 0,
                    fontWeight: 600,
                    color: upgradeResult.success
                      ? 'var(--dsw-alias-state-success-primary)'
                      : 'var(--dsw-alias-state-error-primary)',
                  },
                  role: 'status',
                },
                upgradeResult.message,
              ),
              upgradeResult.output
                ? h(
                  'div',
                  null,
                  h('p', { style: { ...rowLabelStyle, width: 'auto', margin: '8px 0 0' } }, t('resultLabel')),
                  h('pre', { style: preStyle }, upgradeResult.output),
                )
                : null,
            )
            : null,
        ),
        h('div', { style: sectionStyle }, h(CommandBox, { t })),
        upgradeResult && upgradeResult.success
          ? null
          : h('p', { style: noteStyle }, t('restartNote')),
      );
    }

    function FooterAction(props) {
      const t = props.t || ((key) => (en[key] !== undefined ? en[key] : key));
      const wide = props.wide;
      const openPanel = props.openPanel;
      const [tick, setTick] = React.useState(0);
      const { status } = useStatus(tick);
      React.useEffect(() => {
        const id = setInterval(() => setTick((n) => n + 1), REFRESH_MS);
        return () => clearInterval(id);
      }, []);
      const update = !!(status && status.updateAvailable);
      const label = update ? t('updateAvailableShort') : t('upToDateShort');
      const hint = t('openPanel') + ' — ' + label;
      const pill = h(
        'button',
        {
          type: 'button',
          className: 'dshuc-foot',
          title: hint,
          'aria-label': hint,
          onClick: openPanel,
          style: {
            display: 'inline-flex', alignItems: 'center', gap: 8, font: 'inherit', fontSize: 14,
            whiteSpace: 'nowrap', boxSizing: 'border-box', height: 32,
            color: 'var(--dsw-alias-label-primary)',
            border: 0, borderRadius: 'var(--dsw-radius-md)', padding: '0 10px',
            cursor: 'pointer', userSelect: 'none',
          },
        },
        h(UpdateIcon, { size: 12 }),
        h('span', null, label),
        update
          ? h('span', {
            'aria-hidden': true,
            style: {
              width: 8, height: 8, borderRadius: '50%', flex: 'none',
              background: 'var(--dsw-alias-state-warn-primary)',
            },
          })
          : null,
      );
      if (!wide) {
        // Collapsed rail: icon only, in normal flow.
        return h(
          'span',
          { style: { display: 'flex', justifyContent: 'center', width: '100%' } },
          h('style', null, SHELL_CSS),
          h(
            'button',
            {
              type: 'button',
              className: 'dshuc-foot',
              title: hint,
              'aria-label': hint,
              onClick: openPanel,
              style: {
                display: 'flex', alignItems: 'center', font: 'inherit',
                color: 'var(--dsw-alias-label-secondary)', background: 'transparent',
                border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer',
              },
            },
            h(UpdateIcon, { size: 14 }),
          ),
        );
      }
      // Wide column: zero-height row so the status shares the launcher's line.
      // The launcher is narrowed by SHELL_CSS, so its hover fill hugs its own
      // content and this text sits outside it at the row's right end.
      return h(
        'span',
        {
          style: {
            position: 'relative', display: 'block', width: '100%', height: 0, overflow: 'visible',
          },
        },
        h('style', null, SHELL_CSS),
        h(
          'span',
          {
            style: {
              position: 'absolute', top: 4, right: 8, zIndex: 20,
              display: 'inline-flex', alignItems: 'center',
            },
          },
          pill,
        ),
      );
    }

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-update-checker: dictionaries');
        const t = ctx.locale.bind(NS);
        ctx.slots.inject('main', () => ctx.slots.register(
          { name: 'main', key: PANEL_ID, locale: NS, inject: () => ({ t }) },
          UpdatePanel,
        ));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
          { name: 'sidebar.panellist', id: PANEL_ID, order: 40, label: () => t('panel'), locale: NS },
          UpdateIcon,
        ));
        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
          {
            name: 'sidebar.footer.action',
            id: 'dsh-update-checker-footer',
            locale: NS,
            inject: () => ({ t, openPanel: () => ctx.layout.selectPanel(PANEL_ID) }),
          },
          FooterAction,
        ));
      },
    };
  },
});
