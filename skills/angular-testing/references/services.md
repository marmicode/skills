# Services

## Contents

1. [Getting the Service](#getting-the-service)
2. [Setup Functions](#setup-functions)
3. [Errors](#errors)
4. [Signals](#signals)
5. [Observables](#observables)
6. [Effects, Resources and Signal Factories](#effects-resources-and-signal-factories)

## Getting the Service

- Always `TestBed.inject(MealPlanner)`, never `new MealPlanner(...)`: tests stay insensitive to how dependencies are injected, and to logic moving into other injectable services.
- A root service needs no provider. Only provide fakes for the dependencies that must be replaced:

  ```ts
  TestBed.configureTestingModule({
    providers: [provideMealRepositoryFake()],
  });
  ```

- Real collaborators _(stores, orchestration services)_ stay real unless they make the test too complex — see [principles.md](principles.md#the-widest-narrow-test).
- If the service calls `HttpClient` directly and there is no repository to fake, see [fakes.md](fakes.md#when-there-is-no-repository-to-fake).

## Setup Functions

```ts
describe(MealPlanner, () => {
  it("adds recipes", async () => {
    const { mealPlanner, burger, salad } = createMealPlanner();

    await mealPlanner.addRecipe(burger);
    await mealPlanner.addRecipe(salad);

    expect(mealPlanner.recipes()).toEqual([
      expect.objectContaining({ name: "Burger" }),
      expect.objectContaining({ name: "Salad" }),
    ]);
  });

  it("does not allow recipe duplicates", async () => {
    const { mealPlanner, burgerDuplicate } =
      await createMealPlannerWithBurger();

    expect(mealPlanner.canAddRecipe(burgerDuplicate)).toBe(false);
  });

  /* Composed setup instead of options. */
  async function createMealPlannerWithBurger() {
    const { mealPlanner, burger, ...utils } = createMealPlanner();

    await mealPlanner.addRecipe(burger);

    return { mealPlanner, ...utils };
  }

  function createMealPlanner() {
    const { getMealPlanner, ...utils } = setUpMealPlanner();
    return { mealPlanner: getMealPlanner(), ...utils };
  }

  /* Deferred instantiation: lets tests arrange fakes before the constructor runs. */
  function setUpMealPlanner() {
    TestBed.configureTestingModule({
      providers: [provideMealRepositoryFake()],
    });

    return {
      getMealPlanner: () => TestBed.inject(MealPlanner),
      mealRepoFake: TestBed.inject(MealRepositoryFake),
      burger: recipeMother.withBasicInfo("Burger").build(),
      burgerDuplicate: recipeMother.withBasicInfo("Burger").build(),
      salad: recipeMother.withBasicInfo("Salad").build(),
    };
  }
});
```

Full example: [examples/meal-planner/meal-planner.spec.ts](examples/meal-planner/meal-planner.spec.ts).

## Errors

```ts
/* Synchronous method: pass a function, not its result. */
expect(() => cart.add(burgerDuplicate)).toThrow(`Can't add item.`);

/* Method returning a promise. */
await expect(mealPlanner.addRecipe(burgerDuplicate)).rejects.toThrow(
  `Can't add recipe.`,
);

/* Method returning an observable. */
await expect(firstValueFrom(recipeRepo.search(filter))).rejects.toThrow(
  "Search failed.",
);
```

When the error type is part of the contract, assert it: `toThrow(RecipeAlreadyAddedError)`.

## Signals

Read signals directly:

```ts
expect(mealPlanner.recipes()).toMatchObject([{ name: "Burger" }]);
```

Reading a value after an action doesn't prove that it is **reactive**: a plain getter would pass too. When reactivity matters _(the view depends on it)_, read the value through a `computed`, which only updates when its signal dependencies change:

```ts
it("notifies when recipes change", async () => {
  const { mealPlanner, salad } = await createMealPlannerWithBurger();

  const canAddSalad = watch(() => mealPlanner.canAddRecipe(salad));

  await mealPlanner.addRecipe(salad);

  expect(canAddSalad()).toBe(false);
});
```

If the project has no such helper, add it to the shared testing utilities:

```ts title="testing/watch.ts"
import { computed, Signal } from "@angular/core";

/**
 * Returns a signal that only updates if `fn` is reactive.
 */
export function watch<T>(fn: () => T): Signal<T> {
  const computedSignal = computed(fn);
  /* Read once to populate the computed signal's cache. */
  computedSignal();
  return computedSignal;
}
```

## Observables

- **One value**: convert to a promise.

  ```ts
  const meals = await lastValueFrom(mealRepo.getMeals()); // completes
  const recipes = await firstValueFrom(mealPlanner.recipes$); // never completes
  ```

- **Several values over time**: subscribe with a spy, unsubscribe when the test finishes, and clear the initial emission when another test covers it.

  ```ts
  it("emits recipes when added", async () => {
    const { mealPlanner, burger } = createMealPlanner();

    const next = vi.fn<(recipes: Recipe[]) => void>();
    const subscription = mealPlanner.recipes$.subscribe(next);
    onTestFinished(() => subscription.unsubscribe());

    next.mockClear();

    await mealPlanner.addRecipe(burger);

    expect(next).toHaveBeenCalledExactlyOnceWith([
      expect.objectContaining({ name: "Burger" }),
    ]);
  });
  ```

- Test the initial emission in its own test _(e.g. `emits an empty array initially`)_: forgetting it is a common bug with observables.
- Test errors too. For a single value: `await expect(firstValueFrom(source$)).rejects.toThrow('...')`. Over time: subscribe with `{ next, error }` spies and assert on `error`.
- Never use the `done` callback: it fails late with a timeout, stops at the first value, and invites nested callbacks.

## Effects, Resources and Signal Factories

- Prefer testing effects and resources through the service or component that uses them, and assert the outcome with `await expect.poll(() => ...)`.
- Don't reach for `TestBed.tick()` _(or the deprecated `TestBed.flushEffects()`)_ to make a test pass: Angular's synchronization is an implementation detail.
- To test a signal factory that needs an injection context on its own, wrap it with a helper:

  ```ts
  it("auto-saves the recipe when it changes", async () => {
    TestBed.configureTestingModule({ providers: [provideStorageFake()] });
    const storage = TestBed.inject(StorageFake);
    const recipe = signal("babaganoush");

    await runInAngular(() => {
      autoSave("favorite-recipe", recipe);
      recipe.set("burger");
    });

    expect(storage.getSync("favorite-recipe")).toBe('"burger"');
  });

  async function runInAngular<RETURN>(
    fn: () => RETURN | Promise<RETURN>,
  ): Promise<RETURN> {
    return TestBed.runInInjectionContext(async () => {
      const appRef = inject(ApplicationRef);
      const result = await fn();
      await appRef.whenStable();
      return result;
    });
  }
  ```

  Think twice before narrowing down tests to that granularity.
