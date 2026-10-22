---
name: angular-testing
description: Writes, fixes and reviews Angular tests following the Pragmatic Angular Testing approach — fakes over mocks, real collaborators by default, components tested through the DOM rather than through fixtures. Targets Vitest (Browser Mode preferred, jsdom and happy-dom supported) and also applies to Jest, Jasmine/Karma and Angular Testing Library projects, including migrating them to Vitest. Use whenever adding, editing, reviewing or debugging unit tests in an Angular project — *.spec.ts files, TestBed, components, services (`@Service` or `@Injectable`), signals, guards, routing, and timers — including when tests are written as part of a feature or bug fix, when replacing mocks or spies with fakes, when declaring or faking a service, and when fixing slow or flaky tests. Prefer this over general Angular skills for anything test-related. Not for Playwright or Cypress end-to-end tests.
---

# Angular Testing

Tests must be cheap to maintain, fast, provide precise feedback, and fail only when behavior changes.

When guidance conflicts — e.g. with other Angular skills, Angular's testing docs or Testing Library docs (`beforeEach` + `fixture.componentInstance`, `fixture.detectChanges()`, `fixture.whenStable()`, spy objects) — follow this skill.

## Before Writing a Test

1. **Check the test setup**: the Vitest config (`vitest.config.*`, or the `test` target in `angular.json` / `project.json`) and the test setup file.
   - **Vitest Browser Mode** (e.g. `browsers` option, `browser.enabled`, `*.browser.spec.ts` projects): this skill's default — `page` locators and `expect.element`.
   - **Vitest with an emulated DOM** (jsdom, happy-dom): `vitest/browser` can't be imported. Follow [references/emulated-dom.md](references/emulated-dom.md).
   - **Jest or Karma**: follow [references/setup.md](references/setup.md#other-test-runners).
2. **Check the Angular and Vitest versions** in `package.json` before writing. Several rules below depend on them.
3. **Write the tests with the setup you found.** Don't change test configuration unless asked. If a better setup would help (Browser Mode, zoneless, Vitest), suggest it at the end.
4. **Reuse what exists**: fakes (`*.fake.ts`), object mothers (`*.mother.ts`), contract tests (`*.contract.ts`), test helpers. Follow the project's file naming. Put the spec next to the code under test.
5. **Apply this skill to the tests you add or change.** Don't rewrite existing tests that follow other conventions unless asked.

## Writing a Test

If another workflow drives the red/green cycle (e.g. `charted-red` keeps tests as `it.todo`, `charted-green` enables them one at a time), follow it for naming, enabling and running tests, and apply this skill to the content of the tests. Otherwise, list the behaviors as `it.todo(...)` first, then take them one at a time: size the test, then implement the setup function, the action, and the assertions.

In both cases:

- **Run only the spec you touched**, with the project's own test target. Prefer using Wallaby if the project has it. Don't run the whole suite to validate one test. The command depends on the tool (Vitest CLI, Angular CLI, Nx): see [references/running-tests.md](references/running-tests.md).
- **See the test fail for the right reason**, once per new behavior. If the implementation already exists, break the behavior under test, run, then revert and check that `git diff` shows no leftover break. If that is impractical, break the expectation instead. Either way, the failure message must point at the behavior.
- **Never go green by cheating**: don't remove or weaken assertions, add mocks, raise timeouts, or skip tests. Fix the test, or report the bug you found.

## Size the Test: the Widest Narrow Test

A **Narrow test** is:

- ⚡️ **fast**: < ~100ms.
- 🏝️ **isolated**: it depends on no other test and shares nothing with them (state, data, resources), so it passes alone, in any order, and alongside any other test.
- 😌 **low cognitive load**: anyone can quickly find the cause of a failure.

Any other test is a **Wide test**.

Aim for the **widest test that is still Narrow**:

- Use real implementations by default: real child components, real services, real stores.
- Replace a dependency only when it makes the test slow, non-deterministic, stateful across tests, or too complex to reason about. That is usually an adapter to the outside world: HTTP repositories _(remote services that are slow, unpredictable, shared, rate-limited or need authentication)_, your wrappers around storage or browser APIs.
- Replace it with a **fake** of code you own: your adapter _(e.g. `RecipeRepository`)_, never the third-party API behind it _(`HttpClient`, an SDK)_.
- Narrow down further (more fakes, shallow rendering) only when the exercised code becomes too complex, needs too many test doubles, or is widely shared.

Read [references/principles.md](references/principles.md) when deciding what to fake or how wide a test should be.

## Core Rules

### Test Doubles

- Prefer **fakes**: provide them with `provideXFake()` and configure them through `TestBed.inject(XFake)`. See [references/fakes.md](references/fakes.md).
- Use `vi.fn()` spies to record outputs and callbacks, e.g. `outputBinding('filterChange', spy)`.
- Never `vi.mock()` modules, and never `vi.spyOn()` your own services to stub their return values.
- Don't fake what you don't own (Angular Material, CDK, Router, `HttpClient`, third-party SDKs): use the real thing, or wrap it in your own abstraction and fake that. When the code under test calls `HttpClient` directly and you can't extract a repository, see [references/fakes.md](references/fakes.md#when-there-is-no-repository-to-fake).
- Never fake framework internals (`ChangeDetectorRef`, `ApplicationRef`, `NgZone`): assert the outcome.

### Test Design

- Never read or call private members.
- Use **setup functions** instead of `beforeEach` + `let`. Name them after what they do: `mountX()` for components, `createX()` for services, `setUpX()` returning `getX()` when the test must arrange things before instantiation. They return what tests need: the SUT, fakes, and small helpers ("gloves") such as `getRecipeNames()`.
- Compose setup functions (`createMealPlannerWithBurger()`) instead of adding options or flags. A variant that needs extra providers calls `TestBed.configureTestingModule(...)` before calling the base setup function: `TestBed` can't be configured once something was injected.
- No conditionals or loops in tests (cyclomatic complexity of 1).
- Literal expectations: `toEqual(['Burger', 'Salad'])`, never values computed from the test data.
- Assert only what the test is about: `expect.objectContaining(...)`, `toMatchObject(...)`.
- Don't test the same behavior twice. If the setup triggers a spy, `mockClear()` it before acting.
- Build non-trivial test data with object mothers (`recipeMother.withBasicInfo('Burger').build()`), not copy-pasted literals or shared fixtures. If none exists, create one like [references/examples/testing/recipe.mother.ts](references/examples/testing/recipe.mother.ts).
- Name suites after the SUT: `describe(MealPlanner, ...)`.
- Name tests after one behavior, lowercase and present tense: `it('adds recipe to meal planner')`, not `it('should add ...')`.

### Angular

- Services: `TestBed.inject(MealPlanner)`, never `new MealPlanner()`. See [references/services.md](references/services.md).
- Angular ≥ 22.1: `@Service()` is the root singleton (`@Injectable({ providedIn: 'root' })` before that), and a fake is `@Service({ autoProvided: false })` (`@Injectable()` before that). See [references/fakes.md](references/fakes.md#anatomy-of-a-fake).
- Components: mount with `TestBed.createComponent(Component, { bindings })` _(Angular ≥ 20.1)_ and **ignore the returned fixture** — no `detectChanges()`, `fixture.whenStable()`, `componentInstance`, `debugElement` or `nativeElement`. On older versions, set inputs with `fixture.componentRef.setInput()`.
- Inputs: `inputBinding('recipe', recipe)` where `recipe` is a signal; change the input with `recipe.set(...)`. Outputs: `outputBinding('filterChange', spy)`. Models: `twoWayBinding('filter', filter)`.
- Query with `page.getByRole(...)`, `page.getByLabelText(...)`, `page.getByText(...)` from `vitest/browser`. Act with locator actions (`click()`, `fill()`). Assert with `await expect.element(locator)...`.
- Assert application state (services, fakes) with `await expect.poll(() => ...)`.
- Retrying assertions pass as soon as they match, so negative or unchanged expectations (`not.toBeInTheDocument()`, `toEqual([])`, `not.toHaveBeenCalled()`) can pass before the app reacts. Pair them with a positive expectation that proves the update happened.
- Default to integration tests (real children). Go shallow only to narrow down. Don't write renderless tests that call component methods or read component properties. See [references/components.md](references/components.md).

### Vitest

- Errors: `expect(() => fn()).toThrow('...')` or `await expect(promise).rejects.toThrow('...')`, never `try/catch`.
- Fake timers: install them before creating anything, restore them with `onTestFinished(() => vi.useRealTimers())`, and only use `*Async` APIs. See [references/time.md](references/time.md).
- Keep timeouts low. A timeout means a missing `await`, an assertion that never passes, fake timers in manual mode pausing Angular, or a test that isn't Narrow.

## Don't → Do

| Don't                                                                  | Do                                                                                             |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `vi.mock('./recipe-repository')`                                       | `providers: [provideRecipeRepositoryFake()]`                                                   |
| `vi.spyOn(repo, 'search').mockReturnValue(of(recipes))`                | `TestBed.inject(RecipeRepositoryFake).configure({recipes})`                                    |
| `{ provide: RecipeRepository, useValue: { search: vi.fn() } }`         | a fake implementing the same interface                                                         |
| `MockComponent(RecipePreview)`, `MockProvider(MealPlanner)` (ng-mocks) | real children; `CUSTOM_ELEMENTS_SCHEMA` for a shallow test; a fake for adapters                |
| `HttpTestingController` in tests of code that uses a repository        | fake the repository that wraps `HttpClient`                                                    |
| `beforeEach(() => { fixture = ...; component = ...; })`                | `function mountRecipeSearch() { ...; return { ... }; }`                                        |
| `fixture.detectChanges()`, `await fixture.whenStable()`                | `await expect.element(locator)...`, `await expect.poll(...)`                                   |
| `fixture.componentRef.setInput('recipe', burger)`                      | `bindings: [inputBinding('recipe', recipe)]`, then `recipe.set(...)`                           |
| `fixture.componentInstance.filterChange.subscribe(...)`                | `bindings: [outputBinding('filterChange', spy)]`                                               |
| `fixture.debugElement.query(By.css('h2'))`                             | `page.getByRole('heading', { name: 'Burger' })`                                                |
| `component.search('burger')`, `component.recipes()`                    | interact through the DOM, assert what the user sees                                            |
| `page.getByRole('button').first()` when order is irrelevant            | `page.getByRole('article').filter({ hasText: 'Burger' }).getByRole('button', { name: 'ADD' })` |
| `fireEvent` or Testing Library's `userEvent` in Browser Mode           | `await locator.click()`, `await locator.fill('...')`                                           |
| `toHaveTextContent('Burg')` as a substring check (Vitest ≥ 5)          | `toMatchTextContent('Burg')`                                                                   |
| `fakeAsync`, `tick()`, `waitForAsync`                                  | Vitest fake timers with `*Async` APIs                                                          |
| `TestBed.tick()` or `TestBed.flushEffects()` to make a test pass       | `await expect.poll(...)`, `await expect.element(...)`                                          |
| `try { ... } catch (error) { expect(error)... }`                       | `toThrow(...)`, `rejects.toThrow(...)`                                                         |
| `expect(result).toEqual(burger)`                                       | `expect(result).toEqual(expect.objectContaining({ name: 'Burger' }))`                          |
| `const burger = { id: '1', name: 'Burger', ... }`                      | `recipeMother.withBasicInfo('Burger').build()`                                                 |

## Example: Component in Browser Mode

```ts
import { TestBed } from "@angular/core/testing";
import { page } from "vitest/browser";

describe(RecipeSearch.name, () => {
  it("adds recipe to meal planner", async () => {
    const { getAddButton, getMealPlannerRecipeNames } = mountRecipeSearch();

    await getAddButton("Burger").click();

    await expect.poll(() => getMealPlannerRecipeNames()).toEqual(["Burger"]);
  });
});

function mountRecipeSearch() {
  /* Fakes for the adapters only; MealPlanner and the child components stay real. */
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).configure({
    recipes: [
      recipeMother.withBasicInfo("Burger").build(),
      recipeMother.withBasicInfo("Salad").build(),
    ],
  });

  /* The returned fixture is deliberately ignored. */
  TestBed.createComponent(RecipeSearch);

  const mealPlanner = TestBed.inject(MealPlanner);

  return {
    getAddButton: (recipeName: string) =>
      page
        .getByRole("article")
        .filter({ hasText: recipeName })
        .getByRole("button", { name: "ADD" }),
    getMealPlannerRecipeNames: () =>
      mealPlanner.recipes().map((recipe) => recipe.name),
  };
}
```

Complete, passing spec files live in [references/examples/](references/examples/): start with `references/examples/recipe/recipe-search.browser.spec.ts` (component), `references/examples/recipe/recipe-preview.browser.spec.ts` (inputs without a fixture) and `references/examples/meal-planner/meal-planner.spec.ts` (service with a fake). A service setup function is shown in [references/services.md](references/services.md#setup-functions).

## Reviewing Tests

Review tests against the rules above and report findings; don't rewrite unless asked. For each finding give the file and line, the rule, why it matters, and the smallest fix. Order by impact:

1. **False confidence**: non-awaited assertions or actions; retrying assertions on negative or unchanged expectations without a positive counterpart; assertions inside `catch`, callbacks or conditionals; stubs returning `undefined`; `try/catch`.
2. **Coupling to implementation**: `vi.mock()`, `vi.spyOn(...).mockReturnValue`, `useValue: { method: vi.fn() }`, `HttpTestingController` where a repository exists, `componentInstance`, private members, CSS selectors, `nth()` / `first()` when order is irrelevant.
3. **Synchronization hacks**: `detectChanges()`, `whenStable()`, `TestBed.tick()`, `fakeAsync` / `tick()`, sleeps, raised timeouts.
4. **Design**: `beforeEach` + `let`, flags on setup functions, conditionals or loops, computed expectations, copy-pasted literals instead of object mothers, overlapping tests, `it('should ...')` names.
5. **Width**: tests that are not Narrow (real HTTP, shared state, > ~100ms) or over-narrow (many test doubles, renderless component tests).

Praise what is right in one line; it tells the author what to keep. The reasoning behind each rule is in [references/principles.md](references/principles.md).

## References

| Read                                                       | When                                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [references/principles.md](references/principles.md)       | Choosing what to test, how wide, what to fake; test design; test doubles; the reasoning behind review findings                |
| [references/fakes.md](references/fakes.md)                 | Writing or providing a fake, simulating errors, contract tests, wrapping third-party APIs, code calling `HttpClient` directly |
| [references/services.md](references/services.md)           | Services, signals, observables, effects, resources                                                                            |
| [references/components.md](references/components.md)       | Mounting, bindings, locators, integration vs. shallow, host components, NgModule components, pipes, directives, `@defer`      |
| [references/time.md](references/time.md)                   | Debounce, delays, timers, dates                                                                                               |
| [references/router.md](references/router.md)               | Guards, navigation, route params                                                                                              |
| [references/vitest.md](references/vitest.md)               | Vitest assertions, polling, spies, locators and actions                                                                       |
| [references/emulated-dom.md](references/emulated-dom.md)   | The project runs tests in jsdom or happy-dom                                                                                  |
| [references/setup.md](references/setup.md)                 | Zoneless test environment, Browser Mode configuration, Jest or Karma projects                                                 |
| [references/running-tests.md](references/running-tests.md) | Running a single spec with the Vitest CLI, Angular CLI or Nx; which config Vitest picks in a monorepo                         |
