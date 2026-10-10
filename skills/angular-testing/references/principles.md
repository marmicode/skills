# Principles

Framework-agnostic principles behind this skill. Code samples use Vitest.

## Contents

1. [Narrow vs. Wide Tests](#narrow-vs-wide-tests)
2. [The Widest Narrow Test](#the-widest-narrow-test)
3. [When to Narrow Down](#when-to-narrow-down)
4. [Test Doubles](#test-doubles)
5. [Test Design](#test-design)
6. [What Is Worth a Test?](#what-is-worth-a-test)
7. [Tests That Pass While They Shouldn't](#tests-that-pass-while-they-shouldnt)

## Narrow vs. Wide Tests

Forget "unit" vs. "integration": nobody agrees on what a unit is. Categorize tests by their properties.

| Category | Properties |
| --- | --- |
| 🐜 **Narrow** | ⚡️ Fast _(< ~100ms on average)_ · 🏝️ Easy to isolate and parallelize · 😌 Low cognitive load |
| 🐘 **Wide** | Missing at least one Narrow property: slow, hard to isolate, or hard to diagnose |

- **Low cognitive load is the cornerstone.** Anyone — maintainers, contributors, future maintainers, agents — should easily locate the root cause of a failing test.
- A smaller System Under Test (SUT) does not necessarily mean a lower cognitive load: over-narrow tests add setup and test double orchestration.
- A test using a database is still Narrow if each test gets its own fast, isolated instance _(e.g. an in-memory server)_. It is Wide if tests share data or the setup is slow.
- Wide tests are more symmetric to production, predictive, and structure-insensitive. They are also slower, harder to isolate, harder to diagnose, and more prone to flakiness.
- Fast and precise feedback enables baby steps. When many slow, wide cases overlap, fixing one case tends to break another; turning each case into narrower ~5ms tests lets you — or an agent — iterate on a single case at a time.

## The Widest Narrow Test

Prefer the **Honeycomb model** over the misunderstood pyramid: focus on **the widest tests that honor the Narrow test definition**.

Over-narrow tests are:

- **over-specifying**: coupled to implementation details, they don't survive refactoring,
- **expensive to write**: lots of setup and test doubles,
- **expensive to maintain**,
- **not predictive**: all tests pass, but the feature is broken.

### Finding the right size

1. Start with the real implementation of everything the SUT uses.
2. If that breaks a Narrow property _(slow, non-deterministic data, state shared between tests, a remote service that is unreliable, rate-limited, or needs authentication)_, replace the dependency responsible with a **fake**, at the boundary of the code you own _(adapters)_. A remote service that is fast, deterministic, needs no authentication, and is used by a handful of tests can stay real.
3. If the exercised code later becomes too complex to reason about, zoom in: fake the collaborator that carries the complexity.

### Example

`A` depends on `B` and `C`, and `B` depends on `D`:

```
A ──▶ B ──▶ D
└───▶ C
```

| Situation | Exercised code | Fakes |
| --- | --- | --- |
| Everything is fast and simple | A, B, C, D | none |
| `D` is slow or remote _(e.g. a repository)_ | A, B, C | `D` |
| `B` and `C` are too complex | A | `B`, `C` |

Even when `B` and `C` run for real, the SUT is still `A`: `B` may already be tested with a fake of `D`, and `C` separately. Typical mapping: `A` = component, `B` = orchestration service, `C` = store, `D` = repository.

## When to Narrow Down

Narrow a test down when:

- you find yourself debugging unrelated code to understand a failure,
- the test requires too many test doubles,
- the code is widely shared _(e.g. libraries)_,
- edge cases are hard to reach from the outside.

Cognitive load is subjective: the right width depends on the team's experience, the product's phase, and the code's complexity. Treat it as a team decision, like architecture.

## Test Doubles

| Test double | What it is | Use |
| --- | --- | --- |
| **Fake** | A simplified, working implementation _(e.g. in-memory)_ with testing helpers | ✅ Default |
| **Spy** | Records calls for later verification | Outputs and callbacks; indirect outputs only when a fake is not enough |
| **Stub** | Returns hardcoded values | ❌ Avoid |
| **Spying stub** _("mock" in JS slang)_ | Stub + spy, e.g. `vi.fn().mockReturnValue(...)` | ❌ Avoid |
| **Mock** | Pre-programmed with expectations before the SUT runs | ❌ Avoid |
| **Dummy** | A placeholder that should never be used | ❌ Avoid |

Why fakes win:

- **Consistency**: all methods share the same state _(e.g. `search()` reflects `add()`)_, while stubs drift out of sync with each other and with reality.
- **Resilience**: tests check the outcome _(the fake's state)_, not which method was called. Switching from `update()` to `batchUpdate()` breaks no test.
- **Low cognitive load**: tests don't need to know the dependency's API, call order, or return values.
- **Type safety**: an unprogrammed stub returns `undefined` and fails far from the cause _(`Cannot read properties of undefined (reading 'then')`)_.
- **Reusability**: one fake serves many tests, other test runners, demos, and Storybook.
- **Debuggability**: it's plain code; log or set a breakpoint.

Fake guidelines:

- Implement only what tests need. Anything else throws an explicit error _(e.g. `🚧 not implemented yet`)_ instead of returning `undefined`. Throw on unhandled arguments too.
- Configure fakes through methods _(`configure()`, `setRecipes()`)_ and inspect them through synchronous getters _(`getMealsSync()`)_. Don't hardcode data inside fakes.
- Keep fakes self-contained: a fake never depends on another fake.
- Verify fakes with **contract tests**: the same suite runs against the real implementation and the fake.
- Don't fake what you don't own. Either collaborate with the real thing _(a wider test)_ or wrap it in your own abstraction _(an adapter)_ and fake that. Never mimic a third-party library.
- Never fake language or framework primitives. Test the outcome, not the mechanism.
- Fakes are not only for the network: storage, file system, dialogs, browser APIs.
- Keep the number of test doubles per test low. Many test doubles usually mean wrong boundaries, or a test that is too wide or too narrow.

## Test Design

- **Behavior, not structure.** A test should fail when behavior changes, not when code is refactored. Use the public API only; never read private state.
- **Arrange, Act, Assert** _(Given, When, Then)_. Write the steps in plain English first, then the code.
- **Setup functions over `beforeEach`.** Hooks force `let` variables, hide what each test starts with, and get worse with nesting. A setup function returns everything the test needs:

  ```ts
  it('adds two numbers', () => {
    const { calculator } = createCalculator();

    expect(calculator.add(1, 2)).toBe(3);
  });

  function createCalculator() {
    return { calculator: new Calculator() };
  }
  ```

- **Compose setup functions** (`createCartWithItems()`) instead of adding parameters or flags: options add branches to the setup.
- **Gloves**: setup functions can return small helpers that hide interaction details, such as `getRecipeNames()`. Keep them small and explicit — no abstraction is better than the wrong abstraction.
- **Cyclomatic complexity of 1**: no `if`, loops, or `try/catch` in tests.
- **Precise assertions**: check only what the test is about.

  ```ts
  expect(cart.getItems()).toEqual([expect.objectContaining({ name: 'Burger' })]);
  ```

- **Literal expectations**: write the expected values, don't compute them from the test data or from the variables passed to the SUT. The SUT might even mutate them.
- **No overlapping tests**: test each behavior once. Two tests failing for the same reason blur the diagnosis.
- **One or many assertions**: either is fine as long as a failure points to its cause. `expect.soft()` reports several related failures at once.
- **Test data**: use object mothers, which build valid objects with sensible defaults. Partial objects break when types evolve; shared fixtures couple tests together. Keep test data close to the test.

## What Is Worth a Test?

- **Ask future maintainers**: what would someone joining in five weeks — or five years — hope was tested?
- **Assess the risk**: probability × consequences × time to diagnose and fix, compared to the cost of the test.
- **Don't test impossible or hypothetical scenarios.**
- **Coverage is an indicator, not a goal.**
- **Strengthen early safety nets**: when a bug slips through, add a Narrow test where it would have been caught first. Once is no pain, twice is a shame.

## Tests That Pass While They Shouldn't

Watch out for false negatives:

- assertions in code that never runs _(`catch` blocks, callbacks, conditionals)_,
- missing `await` on asynchronous actions or assertions,
- retrying assertions on negative or unchanged expectations _("not displayed", "empty", "not called")_, which pass before the system reacts,
- stubs returning `undefined`, or errors swallowed by the SUT _(including mock assertion errors)_,
- interactions that bypass real constraints, such as dispatching a click on a hidden or covered element,
- helpers that trigger the framework's update cycle and hide reactivity bugs.

The cure: see every new test fail once.
