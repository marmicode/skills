---
name: charted-red
description: Writes the failing tests of a PR (or just the next one with the single-test option) based on provided design doc and existing todo tests
---

# Context

- designDocPath: $ARGUMENTS[0]
- testFilePath: $ARGUMENTS[1]
- singleTest: true if the invocation asks for "single test" / "just a single test" / `--single-test`, otherwise false

# Task

Based on the design doc at ${designDocPath} (if present), implement the bodies of the todo tests in ${testFilePath} without enabling them (i.e. keep "it.todo").

- **Default (`singleTest` false)**: implement **all** the not-yet-implemented todo tests in ${testFilePath} that belong to the PR.
- **Single test (`singleTest` true)**: implement **only the next** not-yet-implemented todo test, then stop.

- Remove the step-by-step comment instructions from the test body and replace them with actual code.
- Remember that you love TDD and you want to write tests first.
- Implement the test only, do not implement the feature.

## Example

### Before

```ts
it.todo("compute sum", () => {
  // Inject calculator
  // Call calculator.sum(1, 2)
  // Assert that the result is 3
});
```

### After

```ts
it.todo("compute sum", () => {
  const calculator = t.inject(Calculator);
  const result = calculator.sum(1, 2);
  expect(result).toBe(3);
});
```
