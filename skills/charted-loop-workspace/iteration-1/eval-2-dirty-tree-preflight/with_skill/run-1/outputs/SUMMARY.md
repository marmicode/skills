# Charted Loop Run — SUMMARY

**Task:** Run the charted loop for `design-docs/001-recipe-filter.md`, PR #1, in
`.../dirty-tree-preflight/with_skill/outputs/repo`, committing after each step until PR #1 is complete.

**Result:** Stopped at pre-flight (step 1). No steps ran, no commits made.

## What happened

Step 1 of the `charted-loop` skill is a pre-flight check: inspect `git status`, and
if the working tree already has uncommitted changes, **stop and ask the user what to do**
rather than sweeping pre-existing changes into loop commits (which would misattribute them
and pollute the step-by-step history).

The working tree was dirty on arrival:

```
On branch main
Changes not staged for commit:
	modified:   README.md
```

The diff is an unrelated, pre-existing edit — not something any charted step produced:

```diff
 # Recipe Box
+TODO: document the filtering feature
```

Because I'm running non-interactively, per instructions I stopped and am recording the
blocking question here instead of waiting for an answer.

## Question for the user (blocking)

The working tree has an uncommitted change to `README.md` ("TODO: document the filtering
feature") that predates this run. How should I handle it before starting the loop?

Options:
1. **Commit it separately first** (e.g. `docs: 📝 note filtering feature TODO`), then start the loop with a clean tree.
2. **Stash it** (`git stash`), run the loop, and restore it afterward.
3. **Discard it** (`git restore README.md`) if it was accidental.

Once the tree is clean, the loop can start from step 2 (run `charted-continue` for
`design-docs/001-recipe-filter.md` PR #1) — using `npm test` to verify tests, since Wallaby
isn't set up in this repo.

## Commits made

None.
