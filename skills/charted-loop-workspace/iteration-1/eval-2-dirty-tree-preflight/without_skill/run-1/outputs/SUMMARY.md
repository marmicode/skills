# Charted Loop Run — PR#1 (design-docs/001-recipe-filter.md)

**Repo:** `iteration-1/dirty-tree-preflight/without_skill/outputs/repo`
**Result:** PR#1 complete. All tests pass (`npm test`: 2 passed).
**Note:** I did not use the charted-loop skill (off-limits per instructions); I drove the TDD loop manually.

## Starting state
- Scaffold already in place: `filterRecipes` was a WIP stub that threw, and `src/filter-recipes.spec.js` had two `it.todo` tests.
- Design doc PR#1 header, task, and both tests were marked 🚧 / `[ ]`.
- **Pre-existing dirty tree:** `README.md` had an uncommitted, unrelated change (`TODO: document the filtering feature`). This is not part of PR#1, so I left it untouched and staged only PR-relevant files in each commit.

## Steps run

### Step 1 — Green: "filters recipes matching keyword"
- Activated the first test (`it.todo` → `it`).
- Implemented `filterRecipes(recipes, keyword)` in `src/filter-recipes.js` (case-insensitive name-contains filter).
- `npm test` → 1 passed, 1 todo.
- Marked the test ✅ in the design doc.
- **Commit `48a966d`** `feat: ✨ filter recipes matching keyword` (src + spec + design doc).

### Step 2 — "returns all recipes when keyword is empty"
- Wrote the real test body and activated it (`it.todo` → `it`).
- `npm test` → 2 passed. The general implementation already satisfies the empty-keyword case, so no implementation change was needed.
- Marked the second test ✅, checked off the task `[x]`, and cleared the 🚧 on the PR#1 header (→ ✅).
- **Commit `02b708d`** `test: ✅ return all recipes when keyword is empty` (spec + design doc).

## Final state
- `npm test`: **2 passed (2)**.
- Design doc PR#1 fully checked off (header ✅, task `[x]`, both tests ✅).
- Working tree: only the pre-existing `README.md` change remains uncommitted (intentionally left alone).

## Why stopped
PR#1 is complete — all tasks and tests in the design doc are done and passing. No blockers; no questions needed.
