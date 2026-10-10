---
name: angular-testing
description: Writes, fixes and reviews Angular tests following the Pragmatic Angular Testing approach — fakes over mocks, real collaborators by default, components tested through the DOM rather than through fixtures. Targets Vitest (Browser Mode preferred, jsdom and happy-dom supported). Use whenever adding, editing, reviewing or debugging tests in an Angular project — *.spec.ts files, TestBed, components, services, signals, guards, routing, and timers — including when tests are written as part of a feature or bug fix, when replacing mocks or spies with fakes, and when fixing slow or flaky tests. Prefer this over general Angular skills for anything test-related. Not for Playwright or Cypress end-to-end tests.
---

# Angular Testing

Tests must be cheap to maintain, fast, and fail only when behavior changes.

When guidance conflicts — e.g. with the testing references of the `angular-developer` skill or with Angular's testing docs (`beforeEach` + `fixture.componentInstance`, `fixture.detectChanges()`, `fixture.whenStable()`, spy objects) — follow this skill.

## Before Writing a Test

1. **Check the test setup**: the Vitest config (`vitest.config.*`, or the `test` target in `angular.json` / `project.json`) and the test setup file.
   - **Vitest Browser Mode** (e.g. `browsers` option, `browser.enabled`, `*.browser.spec.ts` projects): this skill's default — `page` locators and `expect.element`.
   - **Vitest with an emulated DOM** (jsdom, happy-dom): `vitest/browser` can't be imported. Follow [references/emulated-dom.md](references/emulated-dom.md).
   - **Jest or Karma**: follow [references/setup.md](references/setup.md#other-test-runners).
   - **Zone-based test environment**: don't add `detectChanges()` calls. See [references/setup.md](references/setup.md#zoneless-test-environment).
2. **Write the tests with the setup you found.** Don't change test configuration unless asked. If a better setup would help (Browser Mode, zoneless, Vitest), suggest it at the end.
3. **Reuse what exists**: fakes (`*.fake.ts`), object mothers (`*.mother.ts`), contract tests (`*.contract.ts`), test helpers. Follow the project's file naming. Put the spec next to the code under test.
4. **Apply this skill to the tests you add or change.** Don't rewrite existing tests that follow other conventions unless asked.

## Workflow

1. **Name the tests first** with `it.todo(...)`: lowercase, present tense, one behavior each — `it.todo('adds recipe to meal planner')`.
2. **Write the steps in plain English** as comments (arrange, act, assert) before writing code.
3. **Size the test**: the widest Narrow test (next section).
4. **Implement** the setup function, the action, and the assertions.
5. **See the test fail for the right reason.** If the implementation already exists, temporarily break the behavior under test (or the expectation) to see the test fail, then revert it and check that nothing is left behind (`git diff`).
6. **Never go green by cheating**: don't remove or weaken assertions, add mocks, raise timeouts, or skip tests. Fix the test, or report the bug you found.

## Size the Test: the Widest Narrow Test

A **Narrow test** is ⚡️ fast (< ~100ms), 🏝️ isolated (parallelizable, no shared state) and 😌 low cognitive load (anyone can quickly find the cause of a failure). Any other test is a **Wide test**.

Aim for the **widest test that is still Narrow**:

- Use real implementations by default: real child components, real services, real stores.
- Replace a dependency only when it makes the test slow, non-deterministic, stateful across tests, or too complex to reason about. That is usually an adapter to the outside world: HTTP repositories _(remote services that are slow, unpredictable, shared, rate-limited or need authentication)_, storage, browser APIs.
- Replace it with a **fake**, at the boundary of code you own.
- Narrow down further (more fakes, shallow rendering) only when the exercised code becomes too complex, needs too many test doubles, or is widely shared.

Read [references/principles.md](references/principles.md) when deciding what to fake or how wide a test should be.

## Core Rules

### Test Doubles

- Prefer **fakes**: provide them with `provideXFake()` and configure them through `TestBed.inject(XFake)`. See [references/fakes.md](references/fakes.md).
- Use `vi.fn()` spies to record outputs and callbacks, e.g. `outputBinding('filterChange', spy)`. Spy on other calls only when a fake's state can't show the outcome.
- Never `vi.mock()` modules, and never `vi.spyOn()` your own services to stub their return values.
- Don't fake what you don't own (Angular Material, CDK, Router, `HttpClient`, third-party SDKs): use the real thing, or wrap it in your own abstraction and fake that.
- Never fake framework internals (`ChangeDetectorRef`, `ApplicationRef`, `NgZone`): assert the outcome.

### Test Design

- Test behavior through the public API. Never read or call private members.
- Use **setup functions** instead of `beforeEach` + `let`. Name them after what they do: `mountX()` for components, `createX()` for services, `setUpX()` returning `getX()` when the test must arrange things before instantiation. They return what tests need: the SUT, fakes, and small helpers ("gloves") such as `getRecipeNames()`.
- Compose setup functions (`createMealPlannerWithBurger()`) instead of adding options or flags. A variant that needs extra providers calls `TestBed.configureTestingModule(...)` before calling the base setup function: `TestBed` can't be configured once something was injected.
- No conditionals or loops in tests (cyclomatic complexity of 1).
- Literal expectations: `toEqual(['Burger', 'Salad'])`, never values computed from the test data.
- Assert only what the test is about: `expect.objectContaining(...)`, `toMatchObject(...)`.
- Don't test the same behavior twice. If the setup triggers a spy, `mockClear()` it before acting.
- Build complex test data with object mothers (`recipeMother.withBasicInfo('Burger').build()`), not copy-pasted literals or shared fixtures. If none exists, create one like [examples/testing/recipe.mother.ts](examples/testing/recipe.mother.ts).
- Name suites after the SUT: `describe(MealPlanner.name, ...)`.

### Angular

- Services: `TestBed.inject(Service)`, never `new Service()`. See [references/services.md](references/services.md).
- Components: mount with `TestBed.createComponent(Component, { bindings })` _(Angular ≥ 20.1)_ and **ignore the returned fixture** — no `detectChanges()`, `fixture.whenStable()`, `componentInstance`, `debugElement`, `nativeElement` or `componentRef.setInput()`. On older versions, bind inputs and outputs through a host component.
- Inputs: `inputBinding('recipe', recipe)` where `recipe` is a signal; change the input with `recipe.set(...)`. Outputs: `outputBinding('filterChange', spy)`. Models: `twoWayBinding('filter', filter)`.
- Query with `page.getByRole(...)`, `page.getByLabelText(...)`, `page.getByText(...)` from `vitest/browser`. Act with locator actions (`click()`, `fill()`). Assert with `await expect.element(locator)...`.
- Assert application state (services, fakes) with `await expect.poll(() => ...)`.
- Retrying assertions pass as soon as they match, so negative or unchanged expectations (`not.toBeInTheDocument()`, `toEqual([])`, `not.toHaveBeenCalled()`) can pass before the app reacts. Pair them with a positive expectation that proves the update happened, or let the app settle first: advance fake timers past any delay, then `await TestBed.inject(ApplicationRef).whenStable()`.
- Default to integration tests (real children). Go shallow only to narrow down. Don't write renderless tests that call component methods or read component properties. See [references/components.md](references/components.md).

### Vitest

- Errors: `expect(() => fn()).toThrow('...')` or `await expect(promise).rejects.toThrow('...')`, never `try/catch`.
- Fake timers: install them before creating anything, restore them with `onTestFinished(() => vi.useRealTimers())`, and only use `*Async` APIs. See [references/time.md](references/time.md).
- Keep timeouts low. A timeout means a missing `await`, an assertion that never passes, fake timers in manual mode pausing Angular, or a test that isn't Narrow.

## Don't → Do

| Don't                                                            | Do                                                                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `vi.mock('./recipe-repository')`                                 | `providers: [provideRecipeRepositoryFake()]`                                                   |
| `vi.spyOn(repo, 'search').mockReturnValue(of(recipes))`          | `TestBed.inject(RecipeRepositoryFake).setRecipes(recipes)`                                     |
| `{ provide: RecipeRepository, useValue: { search: vi.fn() } }`   | a fake implementing the same interface                                                         |
| `HttpTestingController` in tests of code that uses a repository  | fake the repository that wraps `HttpClient`                                                    |
| `beforeEach(() => { fixture = ...; component = ...; })`          | `function mountRecipeSearch() { ...; return { ... }; }`                                        |
| `fixture.detectChanges()`, `await fixture.whenStable()`          | `await expect.element(locator)...`, `await expect.poll(...)`                                   |
| `fixture.componentRef.setInput('recipe', burger)`                | `bindings: [inputBinding('recipe', recipe)]`, then `recipe.set(...)`                           |
| `fixture.componentInstance.filterChange.subscribe(...)`          | `bindings: [outputBinding('filterChange', spy)]`                                               |
| `fixture.debugElement.query(By.css('h2'))`                       | `page.getByRole('heading', { name: 'Burger' })`                                                |
| `component.search('burger')`, `component.recipes()`              | interact through the DOM, assert what the user sees                                            |
| `page.getByRole('button').first()` when order is irrelevant      | `page.getByRole('article').filter({ hasText: 'Burger' }).getByRole('button', { name: 'ADD' })` |
| `fireEvent` or Testing Library's `userEvent` in Browser Mode     | `await locator.click()`, `await locator.fill('...')`                                           |
| `fakeAsync`, `tick()`, `waitForAsync`                            | Vitest fake timers with `*Async` APIs                                                          |
| `TestBed.tick()` or `TestBed.flushEffects()` to make a test pass | `await expect.poll(...)`, `await expect.element(...)`                                          |
| `try { ... } catch (error) { expect(error)... }`                 | `toThrow(...)`, `rejects.toThrow(...)`                                                         |
| `expect(result).toEqual(burger)`                                 | `expect(result).toEqual(expect.objectContaining({ name: 'Burger' }))`                          |
| `const burger = { id: '1', name: 'Burger', ... }`                | `recipeMother.withBasicInfo('Burger').build()`                                                 |

## Examples

### Service with a fake

```ts
describe(MealPlanner.name, () => {
  it("adds recipes to meal repository", async () => {
    const { mealPlanner, mealRepoFake, burger } = createMealPlanner();

    await mealPlanner.addRecipe(burger);

    expect(mealRepoFake.getMealsSync()).toEqual([
      expect.objectContaining({ name: "Burger" }),
    ]);
  });

  it("throws error if recipe is already present", async () => {
    const { mealPlanner, burgerDuplicate } =
      await createMealPlannerWithBurger();

    await expect(mealPlanner.addRecipe(burgerDuplicate)).rejects.toThrow(
      `Can't add recipe.`,
    );
  });

  async function createMealPlannerWithBurger() {
    const { mealPlanner, burger, ...utils } = createMealPlanner();
    await mealPlanner.addRecipe(burger);
    return { mealPlanner, ...utils };
  }

  function createMealPlanner() {
    TestBed.configureTestingModule({
      providers: [provideMealRepositoryFake()],
    });

    return {
      mealPlanner: TestBed.inject(MealPlanner),
      mealRepoFake: TestBed.inject(MealRepositoryFake),
      burger: recipeMother.withBasicInfo("Burger").build(),
      burgerDuplicate: recipeMother.withBasicInfo("Burger").build(),
    };
  }
});
```

### Component in Browser Mode

```ts
import { page } from "vitest/browser";

describe(RecipeSearch.name, () => {
  it("adds recipe to meal planner", async () => {
    const { getAddButton, getMealPlannerRecipeNames } = mountRecipeSearch();

    await getAddButton("Burger").click();

    await expect.poll(() => getMealPlannerRecipeNames()).toEqual(["Burger"]);
  });

  function mountRecipeSearch() {
    TestBed.configureTestingModule({
      providers: [provideMealRepositoryFake(), provideRecipeRepositoryFake()],
    });

    TestBed.inject(RecipeRepositoryFake).setRecipes([
      recipeMother.withBasicInfo("Burger").build(),
      recipeMother.withBasicInfo("Salad").build(),
    ]);

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
});
```

### Inputs without a fixture

```ts
describe(RecipePreview.name, () => {
  it("shows the new recipe when the input changes", async () => {
    const { recipe, recipeName } = mountRecipePreview();

    recipe.set(recipeMother.withBasicInfo("Salad").build());

    await expect.element(recipeName).toHaveTextContent("Salad");
  });

  function mountRecipePreview() {
    const recipe = signal(recipeMother.withBasicInfo("Burger").build());

    TestBed.createComponent(RecipePreview, {
      bindings: [inputBinding("recipe", recipe)],
    });

    return { recipe, recipeName: page.getByRole("heading") };
  }
});
```

Complete, passing spec files live in [examples/](examples/): start with `examples/recipe/recipe-search.browser.spec.ts` (component) and `examples/meal-planner/meal-planner.spec.ts` (service).

## References

| Read                                                     | When                                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [references/principles.md](references/principles.md)     | Choosing what to test, how wide, what to fake; test design; test doubles                  |
| [references/fakes.md](references/fakes.md)               | Writing or providing a fake, simulating errors, contract tests, wrapping third-party APIs |
| [references/services.md](references/services.md)         | Services, signals, observables, effects, resources                                        |
| [references/components.md](references/components.md)     | Mounting, bindings, locators, integration vs. shallow, host components                    |
| [references/time.md](references/time.md)                 | Debounce, delays, timers, dates                                                           |
| [references/router.md](references/router.md)             | Guards, navigation, route params                                                          |
| [references/vitest.md](references/vitest.md)             | Vitest assertions, polling, spies, locators and actions                                   |
| [references/emulated-dom.md](references/emulated-dom.md) | The project runs tests in jsdom or happy-dom                                              |
| [references/setup.md](references/setup.md)               | Zoneless test environment, Browser Mode configuration, Jest or Karma projects             |
