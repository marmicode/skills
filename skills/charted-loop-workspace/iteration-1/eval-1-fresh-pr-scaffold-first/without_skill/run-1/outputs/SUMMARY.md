# Charted Loop Summary — PR#1 "Filter recipes"

Ran the charted TDD loop manually (scaffold → red → green), committing after each
step. Tests were checked with `npm test` (vitest); Wallaby is not set up in this repo.

**Note:** This is the `without_skill` arm — the charted-loop skill under evaluation
(`/Users/y/dev/marmicode/skills/skills/charted-loop`) was not read or used.

## Steps run & commits

1. **Scaffold** (`a1454cf` — `test: 🚧 scaffold filterRecipes with todo tests`)
   Created `src/filter-recipes.js` (WIP stub returning recipes unchanged) and
   `src/filter-recipes.test.js` with the two design-doc cases as `test.todo`.
   Tests: 2 todo, suite passing.

2. **Red — test 1** (`b951728` — `test: ❌ filters recipes matching keyword`)
   Activated the first test with concrete recipes and a "burger" keyword.
   Failed for the right reason (stub returned all recipes).

3. **Green — test 1** (`dc04c8b` — `feat: ✅ filter recipes by keyword (case-insensitive)`)
   Implemented `filterRecipes` using case-insensitive `includes`. Test 1 passed.
   Checked off "filters recipes matching keyword" in the design doc.

4. **Red/Green — test 2** (`6c87784` — `feat: ✅ return all recipes when keyword is empty`)
   Activated the second test (empty keyword). It passed immediately because the
   existing implementation already returns all recipes for an empty keyword (every
   name "includes" the empty string), so no implementation change was needed.
   Checked off the second test, the task, and marked the PR heading ✅.

## Final state

- All tests green: `Tests 2 passed (2)`.
- Design doc `design-docs/001-recipe-filter.md`: PR#1 heading, the task, and both
  test cases are all marked complete.
- Working tree clean.

## Why stopped

PR#1 is complete — both design-doc tests are implemented and passing, and the single
task is done. Nothing further remained in scope for this PR.
