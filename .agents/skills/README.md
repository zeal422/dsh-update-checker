# Vendored skills

## dsh-doc

Copied from `@deepseek-ai/dsh-agent-preset`, version 0.2.2-rc.5, MIT License, copyright DeepSeek.

It teaches an agent how to look up DeepSeek Harness facts instead of guessing: slot names, service methods, event modes, bundle patches, locale and icon requirements, and the rules for client plugins.

Why it is vendored rather than referenced: the source lives inside the installed harness, and its path changes with every DSH upgrade. An agent working on this repo should not have to find it.

Refresh it from the installed harness, not by hand:

```sh
cp -R "$(npm root -g)/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-agent-preset/skills/dsh-doc/." .agents/skills/dsh-doc/
```

That path assumes a global npm install. If it does not resolve, the harness was installed another way. Find the installed `@deepseek-ai/dsh-agent-preset` and read it before copying.
