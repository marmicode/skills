# Components

## Contents

1. [Choosing the Test Flavor](#choosing-the-test-flavor)
2. [Mounting Without the Fixture](#mounting-without-the-fixture)
3. [Inputs, Outputs and Models](#inputs-outputs-and-models)
4. [Locating Elements](#locating-elements)
5. [Interacting](#interacting)
6. [Asserting](#asserting)
7. [Shallow Tests](#shallow-tests)
8. [Host Components](#host-components)
9. [Pipes and Directives](#pipes-and-directives)
10. [Angular Material and CDK](#angular-material-and-cdk)

## Choosing the Test Flavor

| Flavor                        | What it does                                                                                                         | When                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Integration**               | Renders the component with its real children                                                                         | ✅ Default. Presentational components, and containers that stay simple enough                                                     |
| **Shallow**                   | Renders the component without its children, checks what it passes to their inputs and how it reacts to their outputs | ⚠️ Last resort, to narrow down: children are slow, complex, widely shared, not implemented yet, or make failures hard to diagnose |
| **Renderless** _("isolated")_ | Injects the component class like a service and calls its methods                                                     | ❌ Avoid                                                                                                                          |

- **Integration** tests are the most meaningful _(closest to the user)_ but the slowest, and changes in shared children can break many of them.
- **Shallow** tests are fast and precise, and insensitive to the children's internals. They are coupled to the parent ↔ children interface _(inputs and outputs)_, so choose that boundary wisely.
- **Renderless** tests are coupled to implementation details _(they break when switching from `subscribe` to the `async` pipe to signals)_, can exercise impossible states _(calling `search()` while the form is disabled)_, and miss template bugs. If a component's logic is complex enough to tempt you, move it to a service and test the service.

## Mounting Without the Fixture

```ts
function mountRecipeSearch() {
  /* 1. Providers: fakes for adapters only. */
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });

  /* 2. Arrange the fakes. */
  TestBed.inject(RecipeRepositoryFake).setRecipes([
    recipeMother.withBasicInfo("Burger").build(),
    recipeMother.withBasicInfo("Salad").build(),
  ]);

  /* 3. Mount. The returned fixture is deliberately ignored. */
  TestBed.createComponent(RecipeSearch);

  /* 4. Return locators and gloves. */
  return {
    recipeNames: page.getByRole("heading"),
  };
}
```

- Order: install fake timers if needed → configure providers → arrange fakes → `TestBed.createComponent(...)`.
- `bindings` requires Angular ≥ 20.1. On older versions, keep the fixture and set inputs with `fixture.componentRef.setInput()`.
- The view renders asynchronously. Locator actions and `expect.element` wait for it: don't add `detectChanges()`, `whenStable()` or sleeps.
- Add the providers the app normally registers at bootstrap only if the component needs them _(e.g. `provideRouter([])` for `routerLink`)_.
- Errors thrown while rendering or in event listeners fail the test. Never disable `rethrowApplicationErrors`.
- **Non-standalone components** go in `declarations`, with their `NgModule` dependencies in `imports`, in `TestBed.configureTestingModule`. Everything else _(no fixture, bindings, locators, `overrideComponent` for shallow tests)_ is identical. Don't migrate the component to standalone just to test it.
- **`@defer` blocks** play through like in the browser _(`DeferBlockBehavior.Playthrough` is TestBed's default)_: test the deferred content through the DOM. The only reason to touch the fixture is when the `@placeholder` / `@loading` states are themselves the behavior under test _(`deferBlockBehavior: DeferBlockBehavior.Manual` + `fixture.getDeferBlocks()`)_.

## Inputs, Outputs and Models

**Inputs** — bind a signal, then set it to change the input:

```ts
function mountRecipePreview() {
  const recipe = signal(recipeMother.withBasicInfo("Burger").build());

  TestBed.createComponent(RecipePreview, {
    bindings: [inputBinding("recipe", recipe)],
  });

  return { recipe, recipeName: page.getByRole("heading") };
}

it("shows the new recipe when the input changes", async () => {
  const { recipe, recipeName } = mountRecipePreview();

  recipe.set(recipeMother.withBasicInfo("Salad").build());

  await expect.element(recipeName).toHaveTextContent("Salad");
});
```

- Bind every required input at creation: reading an unset `input.required()` throws.
- For a value that never changes, a function is enough: `inputBinding('recipe', () => burger)`.
- On Angular < 20.1, `inputBinding` doesn't exist: keep the fixture and call `fixture.componentRef.setInput('recipe', burger)`.

**Outputs** — listen with a spy:

```ts
const filterChangeSpy = vi.fn<(filter: RecipeFilterCriteria) => void>();

TestBed.createComponent(RecipeFilter, {
  bindings: [
    outputBinding<RecipeFilterCriteria>("filterChange", filterChangeSpy),
  ],
});

await page.getByLabelText("Max Ingredients").fill("3");

expect(filterChangeSpy).toHaveBeenLastCalledWith(
  expect.objectContaining({
    maxIngredientCount: 3,
  } satisfies Partial<RecipeFilterCriteria>),
);
```

If the output is delayed _(e.g. debounced)_, control time first: see [time.md](time.md).

**Models** — `model()` creates an input and a `<name>Change` output. Either spy on the output as above, or bind both directions to a writable signal:

```ts
const filter = signal(createDefaultRecipeFilterCriteria());

TestBed.createComponent(RecipeFilter, {
  bindings: [twoWayBinding("filter", filter)],
});

await page.getByLabelText("Keywords").fill("Burger");

await expect.poll(() => filter()).toMatchObject({ keywords: "Burger" });
```

Inputs, outputs and models are imported from `@angular/core` (`inputBinding`, `outputBinding`, `twoWayBinding`).

## Locating Elements

Use the `page` API from `vitest/browser`, in this order of preference: `getByRole`, `getByLabelText`, `getByPlaceholder`, `getByText`, `getByAltText` / `getByTitle`, and `getByTestId` as a last resort.

- When several elements match, scope to the container the user would look at instead of picking by position:

  ```ts
  page
    .getByRole("article")
    .filter({ hasText: "Burger" })
    .getByRole("button", { name: "ADD" });
  ```

- Don't locate elements with CSS classes or component selectors.
- Not finding an element by role or label usually reveals an accessibility issue. Point it out, or fix the markup if the task allows it _(a `<label>`, an `aria-label`, a semantic element such as `<article>`)_, instead of falling back to CSS.

## Interacting

- Act like a user, through locator actions: `click()`, `fill()`, `clear()`, `selectOptions()`, `hover()`. They go through the browser provider with actionability checks, so a test can't click a button that users can't reach.
- Don't call component methods, set component properties, dispatch events manually, or use Testing Library's `userEvent` in Browser Mode.
- For what users don't do through this component _(e.g. data changed elsewhere in the app)_, act through the real service or the fake: `await mealPlanner.addRecipe(burger)`.

## Asserting

- What the user sees: `await expect.element(locator).toHaveTextContent(...)`, `.toBeDisabled()`, `.toBeVisible()`, `.toHaveLength(n)`.
- Side effects on application state: `await expect.poll(() => getMealPlannerRecipeNames()).toEqual(['Burger'])`. Don't render another page _(e.g. the meal plan)_ to verify a side effect: the test would become too wide.
- Outputs: assert on the spy after the action.

## Shallow Tests

```ts
function mountRecipeSearch() {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });

  /* Must happen before `createComponent`. */
  TestBed.overrideComponent(RecipeSearch, {
    set: {
      /* Whitelist what the template needs (e.g. pipes), drop child components. */
      imports: [],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    },
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes([
    recipeMother.withBasicInfo("Burger").build(),
    recipeMother.withBasicInfo("Salad").build(),
  ]);

  TestBed.createComponent(RecipeSearch);

  return {
    /* Read what the parent passes to the children's inputs. */
    getRecipePreviewNames: () =>
      page
        .getByTestId("recipe-preview")
        .elements()
        .map((el) => new DebugElement(el).properties["recipe"].name),
    /* Simulate a child's output. */
    updateFilter: async (filter: RecipeFilterCriteria) => {
      const filterEl = await vi.waitFor(() =>
        page.getByTestId("recipe-filter").element(),
      );
      new DebugElement(filterEl).triggerEventHandler("filterChange", filter);
    },
  };
}

it("searches recipes using the filter emitted by recipe filter", async () => {
  const { getRecipePreviewNames, updateFilter } = mountRecipeSearch();

  await updateFilter({
    keywords: "Burg",
    maxIngredientCount: null,
    maxStepCount: null,
  });

  await expect.poll(() => getRecipePreviewNames()).toEqual(["Burger"]);
});
```

- Locate child placeholders through a `data-testid` on the child's host element in the parent's template _(e.g. `<wm-recipe-preview data-testid="recipe-preview" [recipe]="recipe">`)_: inert custom elements have no role or label.
- Whitelist imports with `set` rather than removing children one by one: it's cheaper to maintain and keeps tests fast.
- `CUSTOM_ELEMENTS_SCHEMA` turns unknown children into inert custom elements; their bindings become element properties _(signal inputs included)_. If Angular still complains about unknown properties on directives, use `NO_ERRORS_SCHEMA`.
- A shallow SUT may include more than one component: keep the children that belong to the same unit of behavior.

Full example: [examples/recipe/recipe-search.shallow.browser.spec.ts](examples/recipe/recipe-search.shallow.browser.spec.ts).

## Host Components

For content projection, directives, or anything that needs a parent template, declare a small host component in the spec:

```ts
@Component({
  imports: [RecipePreview],
  template: `<wm-recipe-preview [recipe]="burger">
    <button>Cook</button>
  </wm-recipe-preview>`,
})
class RecipePreviewHost {
  burger = recipeMother.withBasicInfo("Burger").build();
}

it("projects content", async () => {
  TestBed.createComponent(RecipePreviewHost);

  await expect
    .element(page.getByRole("article").getByRole("button", { name: "Cook" }))
    .toBeVisible();
});
```

## Pipes and Directives

- **Pipes**: inject the pipe class with `TestBed.inject(MyPipe)` _(provide it in `TestBed.configureTestingModule` unless `@Pipe` sets `providedIn: 'root'`. `@Pipe` is unchanged by `@Service`)_ and test `transform()` as a pure function. Render it in a host component only when the behavior depends on the template _(e.g. a pipe that subscribes, like `async`)_.
- **Directives**: always through a [host component](#host-components) and the DOM, never by instantiating the directive class.

## Angular Material and CDK

- Use them for real and locate their elements by role or label: `mat-label` is associated with its input, so `page.getByLabelText('Keywords')` works.
- Overlays _(dialogs, menus, snack bars)_ render outside the component's host element. `page` locators search the whole page, so they find them: `await expect.element(page.getByRole('dialog')).toMatchTextContent('Delete this recipe?')` _(`toHaveTextContent` on Vitest 4)_.
- If they make a test slow or complex, wrap them in your own abstraction and fake it: see [fakes.md](fakes.md#wrapping-what-you-dont-own).
