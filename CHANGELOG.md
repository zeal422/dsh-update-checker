## [1.0.2](https://github.com/zeal422/dsh-update-checker/compare/v1.0.1...v1.0.2) (2026-11-26)


### Bug Fixes

* keep the lockfile version in step with package.json ([9bb46e3](https://github.com/zeal422/dsh-update-checker/commit/9bb46e3d2c6ca6473af9f3e273f19c3a8ae3d08c))


### Chores

* block commits on a stale branch and ban dash punctuation ([056079c](https://github.com/zeal422/dsh-update-checker/commit/056079c3b82dab3b0d7d20cc2c1e4c39ad92d3f8))
* enforce the release pipeline invariants in CI ([acca3c5](https://github.com/zeal422/dsh-update-checker/commit/acca3c54f2b6e2b16b1200554d3e17936447c222))


### Continuous Integration

* release every push with a frozen major number ([0722020](https://github.com/zeal422/dsh-update-checker/commit/0722020cd277bd237face9b0ace0e255fa449902))


### Documentation

* match the docs to the checks they describe ([9bfd107](https://github.com/zeal422/dsh-update-checker/commit/9bfd107581fab79ad0e975560c43891e6ddd8e44))

## [1.0.1](https://github.com/zeal422/dsh-update-checker/compare/v1.0.0...v1.0.1) (2026-11-26)


### Bug Fixes

* make the release pipeline actually run ([0fab2fe](https://github.com/zeal422/dsh-update-checker/commit/0fab2fee9ee6518bcfb2c15c87db401029a4cefa))
* use the presets semantic-release ships ([0c9a796](https://github.com/zeal422/dsh-update-checker/commit/0c9a796d40dd69179963fc59e88e4102715f804d))

# [1.0.0](https://github.com/zeal422/dsh-update-checker/releases/tag/v1.0.0) (2026-11-25)

### Features

* updates panel with the installed and latest version, manual refresh, and an upgrade that asks for confirmation
* status in the sidebar footer next to the account row, with an amber dot when a release is waiting
* amber dot on the Updates sidebar icon while a release is waiting
* agent tools `dsh_check_update` and `dsh_upgrade_dsh`
* English and Chinese strings

### Notes

* this entry was written by hand, before release automation existed. Later entries are generated from commit messages and grouped by type.
