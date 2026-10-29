# Skill Evals

Each skill gets a [promptfoo](https://www.promptfoo.dev) suite that runs Claude Code on a fixture project with only that skill available.

```sh
pnpm install                  # also installs each fixture's own node_modules and browsers
export ANTHROPIC_API_KEY=...
pnpm eval:angular-testing
pnpm eval:view
```

## Layout

```
evals/
  shared/
    hooks.ts                  # clones each fixture into fixtures/tmp, then copies skills into the with-skills clone
  <skill>/
    promptfooconfig.ts        # the suite; Claude Code copies the clone per test
    tests/<scenario>.ts       # one TestCase per file, imported by the suite
    fixtures/<project>/       # the project Claude Code works on
    fixtures/tmp/             # gitignored clones: <project>-with-skills and <project>-without-skills
```

## Adding a Skill

1. Create `evals/<skill>/fixtures/<project>/` with its own `package.json`, then run `pnpm install` at the root.
2. Create `evals/<skill>/promptfooconfig.ts` with the Claude Code provider and the `beforeAll` hook. Copy `angular-testing` as a starting point.
3. Add a `eval:<skill>` script to the root `package.json`.

Assertions read the generated files from `context.metadata.workingDir`, the test's copy of the fixture. promptfoo deletes the copy once the assertions are done.
