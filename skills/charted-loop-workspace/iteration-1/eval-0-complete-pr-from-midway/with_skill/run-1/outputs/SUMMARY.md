# Charted Loop Summary — PR #1 (Recipe Filtering)

Ran the `charted-loop` skill for `design-docs/001-recipe-filter.md`, PR #1, in
`.../with_skill/outputs/repo`. Tests were checked with `npm test` (vitest), since
Wallaby is not set up in this repo.

## Starting state (mid-PR)

Scaffolding was already done and committed (`210fd4e build: 📦 setup project`):
- WIP stub `filterRecipes` throwing `🚧 work in progress`
- Two `it.todo` tests — the first already had a real body (implemented), the
  second had only step comments (not implemented)

## Steps run (one commit per step)

1. **green** — activated `it('filters recipes matching keyword')`, implemented
   `filterRecipes` (case-insensitive name `includes`), flipped that scenario to
   ✅ in the design doc. Verified 1 passing / 1 todo.
   → `fe9e64a feat: ✨ filter recipes by keyword`

2. **red** — wrote the body of `it.todo('returns all recipes when keyword is
   empty')` without enabling it. Tests still green (1 passing / 1 todo).
   → `54296e5 test: ✅ add empty-keyword recipe filtering test`

3. **green** — activated the empty-keyword test (passed with no implementation
   change, since `includes('')` is always true), removed the `@deprecated 🚧`
   wiprecation jsdoc now that the function is complete, and checked off the
   remaining design-doc items (second scenario ✅, Task `[x]`, PR heading ✅).
   Verified 2 passing.
   → `c47d6d2 feat: ✨ return all recipes for empty keyword`

## Why it stopped

PR #1 is complete: both Testing Strategy scenarios are ✅, the single Task is
checked, and the PR heading is `# ✅ PR#1`. Per the loop rules, no empty commit
was created. All tests pass (`2 passed`). Working tree is clean.
