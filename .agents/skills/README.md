# Vendored skills

## dsh-doc

Copied from `@deepseek-ai/dsh-agent-preset`, version 0.2.2-rc.5, MIT License, copyright DeepSeek.

It teaches an agent how to look up DeepSeek Harness facts instead of guessing: slot names, service methods, event modes, bundle patches, locale and icon requirements, and the rules for client plugins.

Why it is vendored rather than referenced: the source lives inside the installed harness, and its path changes with every DSH upgrade. An agent working on this repo should not have to find it.

Refresh it with the harness, not by hand:

```sh
cp -R "$(dirname "$(node -p "require.resolve('@deepseek-ai/dsh-agent-preset/package.json')")")/skills/dsh-doc/." .agents/skills/dsh-doc/
```

If that path no longer resolves, the layout changed. Read the installed package before copying.
