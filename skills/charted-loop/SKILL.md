---
name: charted-loop
description: Runs the full Charted Coding loop for a PR — repeatedly invokes charted-continue (scaffold, red, or green) and commits after each step with the step-matching prefix, until the PR is complete. Use when the user wants to drive a whole PR end to end, says "run the loop", "charted loop", "keep going until the PR is done", or asks to continue step by step with a commit after each step.
---

# Context

- designDocPath: $ARGUMENTS[0]
- prNumber: $ARGUMENTS[1]

# Goal

Drive PR #${prNumber} of `${designDocPath}` to completion by looping:

```
pre-flight --> [ charted-continue --> commit ] --> repeat until PR is ✅
```

`charted-continue` performs exactly one step per run (scaffold, red, or green). This skill wraps it in a loop and commits after every step, so the resulting history mirrors the TDD cycle one commit at a time — reviewable, revertable, and easy to resume.

# Steps

## 1. Pre-flight: require a clean working tree

Run `git status`. If the working tree has uncommitted changes, **stop and ask the user** how to handle them (commit separately first, stash, or discard). Do not start the loop on a dirty tree: pre-existing changes would get swept into step commits, misattributing them and polluting the step-by-step history.

## 2. Run one step

Read and follow the `charted-continue` skill with `${designDocPath}` and `${prNumber}`. Follow it fully — it inspects the design doc and code state, then delegates to exactly one of `charted-scaffold`, `charted-red`, or `charted-green` (including their test verification and design-doc checkbox updates).

If `charted-continue` reports that PR #${prNumber} is complete, go to step 5.

## 3. Commit the step

Create **one commit** containing everything the step changed — code, tests, and design-doc checkmark updates. The prefix depends on which step just ran:

| Step ran           | Prefix         | Why                                                   |
| ------------------ | -------------- | ----------------------------------------------------- |
| `charted-scaffold` | `refactor: 🛠️` | Pure structure — WIP stubs, nothing wired up yet      |
| `charted-red`      | `test: ✅`     | Test-only change (the test is written, still `.todo`) |
| `charted-green`    | `feat: ✨`     | Behavior is now wired up and passing                  |

Use `fix: 🐞` instead of `feat: ✨` when the green step fixes a bug rather than adding behavior (per the design doc's framing).

The subject describes what the step actually did, not the loop mechanics:

- Good: `test: ✅ add empty-keyword recipe filtering test`
- Good: `refactor: 🛠️ scaffold recipe filtering`
- Bad: `test: ✅ red step 2`

If a `commit` skill is available, follow its conventions for format and scope; the prefixes above already conform to it.

## 4. Loop

Go back to step 2. One step, one commit — never batch several steps into a single commit, and never run a step without committing it before the next one.

If an iteration makes no progress (the same test is still pending and nothing changed — e.g. a green step that cannot converge), stop and surface the problem to the user instead of looping forever.

## 5. Finish

When every scenario of PR #${prNumber} is ✅:

- Verify the tests pass and the working tree is clean (everything committed).
- Do **not** create an empty "done" commit.
- Do **not** push — the user decides when to share the branch.
- Report a short summary: the steps run, their commits, and why the loop stopped.

# Rules

- Exactly one commit per step, with the prefix matching the step type.
- Never commit pre-existing or unrelated changes — that's what the pre-flight guard is for.
- Trust `charted-continue`'s routing; do not second-guess or skip ahead to a later test.
- Test verification belongs to the downstream skills (Wallaby by default); if the user names a different test command (e.g. `npm test`), pass that instruction through.
- If any step fails or is blocked, stop, leave the tree in the last committed good state, and ask the user.
