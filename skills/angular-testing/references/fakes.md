# Fakes in Angular

Why fakes beat stubs, spies and mocks: [principles.md](principles.md#test-doubles).

## Contents

1. [Anatomy of a Fake](#anatomy-of-a-fake)
2. [Providing and Configuring a Fake](#providing-and-configuring-a-fake)
3. [Arranging Before Instantiation](#arranging-before-instantiation)
4. [Simulating Errors](#simulating-errors)
5. [Wrapping What You Don't Own](#wrapping-what-you-dont-own)
6. [Contract Tests](#contract-tests)
7. [Testing the Adapters Themselves](#testing-the-adapters-themselves)
8. [When There Is No Repository to Fake](#when-there-is-no-repository-to-fake)
9. [Where Fakes Live](#where-fakes-live)

## Anatomy of a Fake

1. **Interface**: extract the public API of the real service into an interface (`RecipeRepositoryDef`). The real service and the fake both implement it, so the fake doesn't have to mimic private members or depend on infrastructure.
2. **Fake class**: `@Service({ autoProvided: false })` — not `@Service()`. Forgetting to provide it then fails loudly instead of silently using the real service. Before Angular 22.1, that is `@Injectable()` with no `providedIn`.
3. **In-memory state**, shared by all methods so they stay consistent.
4. **Lazy observables**: wrap the work in `defer(...)` so nothing happens until the caller subscribes, like a real HTTP call. A SUT that forgets to subscribe then fails the test instead of passing by accident.
5. **Testing helpers**: methods to arrange (`setRecipes()`, `configure()`) and to inspect (`getMealsSync()`). Add them only when a test needs them.
6. **Explicit failures**: methods or arguments the fake doesn't support throw instead of returning `undefined`.

```ts title="recipe-repository.ts"
export interface RecipeRepositoryDef {
  search(filter?: RecipeFilterCriteria): Observable<Recipe[]>;
}

@Service()
export class RecipeRepository implements RecipeRepositoryDef {
  private _httpClient = inject(HttpClient);
  ...
}
```

```ts title="recipe-repository.fake.ts"
@Service({ autoProvided: false })
export class RecipeRepositoryFake implements RecipeRepositoryDef {
  private _recipes: Recipe[] = [];

  search(
    {
      keywords,
      maxIngredientCount,
      maxStepCount,
    }: RecipeFilterCriteria = createDefaultRecipeFilterCriteria(),
  ): Observable<Recipe[]> {
    return defer(() => {
      const recipes = this._recipes.filter((recipe) => {
        const conditions = [
          () => (keywords ? recipe.name.includes(keywords) : true),
          () =>
            maxIngredientCount != null
              ? recipe.ingredients.length <= maxIngredientCount
              : true,
          () =>
            maxStepCount != null ? recipe.steps.length <= maxStepCount : true,
        ];
        return conditions.every((condition) => condition());
      });
      return of(recipes);
    });
  }

  setRecipes(recipes: Recipe[]) {
    this._recipes = recipes;
  }
}

export function provideRecipeRepositoryFake(): EnvironmentProviders {
  return makeEnvironmentProviders([
    RecipeRepositoryFake,
    { provide: RecipeRepository, useExisting: RecipeRepositoryFake },
  ]);
}
```

Unsupported methods and arguments fail explicitly. E.g., if `RecipeRepositoryDef` had an `updateRecipe()` method that no test needs yet:

```ts
updateRecipe(recipeId: string, data: Partial<Recipe>): Observable<void> {
  throw new Error('🚧 RecipeRepositoryFake#updateRecipe is not implemented yet');
}
```

## Providing and Configuring a Fake

```ts
TestBed.configureTestingModule({
  providers: [provideRecipeRepositoryFake()],
});

TestBed.inject(RecipeRepositoryFake).setRecipes([
  recipeMother.withBasicInfo("Burger").build(),
]);
```

- `useExisting` provides the **same instance** as both `RecipeRepository` and `RecipeRepositoryFake`: inject the fake by its own class, never `TestBed.inject(RecipeRepository) as RecipeRepositoryFake`.
- Configure the fake **before** the SUT reads from it: before `TestBed.createComponent(...)`, or before injecting a service that fetches in its constructor.
- Assert side effects on the fake's state, not on calls:

  ```ts
  expect(mealRepoFake.getMealsSync()).toEqual([
    expect.objectContaining({ name: "Burger" }),
  ]);
  ```

## Arranging Before Instantiation

When the service reads its dependencies at construction time, return a getter so the test can arrange first. Arrange through the fake's testing helpers (`setMeals()`): its lazy API (`addMeal()`) does nothing until someone subscribes.

```ts
it("fetches recipes from meal repository", async () => {
  const { getMealPlanner, mealRepoFake, burger } = setUpMealPlanner();

  mealRepoFake.setMeals([burger]);

  const mealPlanner = getMealPlanner();
  expect(mealPlanner.recipes()).toEqual([
    expect.objectContaining({ name: "Burger" }),
  ]);
});

function createMealPlanner() {
  const { getMealPlanner, ...utils } = setUpMealPlanner();
  return { mealPlanner: getMealPlanner(), ...utils };
}

function setUpMealPlanner() {
  TestBed.configureTestingModule({
    providers: [provideMealRepositoryFake()],
  });

  return {
    getMealPlanner: () => TestBed.inject(MealPlanner),
    mealRepoFake: TestBed.inject(MealRepositoryFake),
    burger: recipeMother.withBasicInfo("Burger").build(),
  };
}
```

## Simulating Errors

Give the fake a simple, documented trigger instead of reprogramming it per test:

```ts
@Service({ autoProvided: false })
export class CookbookRepositoryFake implements CookbookRepositoryDef {
  /**
   * Searching with keywords containing this token fails.
   */
  static readonly INVALID_TOKEN = '💥';

  searchCookbooks(keywords: string | null): Observable<Cookbook[]> {
    return defer(() => {
      if (keywords?.includes(CookbookRepositoryFake.INVALID_TOKEN)) {
        throw new Error('CookbookRepositoryFake: invalid token in keywords.');
      }
      ...
    });
  }
}
```

```ts
await typeKeywords(`Ottolenghi ${CookbookRepositoryFake.INVALID_TOKEN}`);
```

## Wrapping What You Don't Own

Never fake Angular Material, CDK, Router, `HttpClient` or third-party SDKs directly. In order of preference:

1. **Collaborate with the real thing**: open the real `MatDialog`, interact with it through `page`, and assert the outcome. This is usually the widest Narrow test.
2. **Wrap it in your own abstraction** when the real thing makes the test too complex or slow, then fake your abstraction. Keep the abstraction tailored to your needs, not a copy of the library's API. When the code calls `HttpClient` and there is no such abstraction yet, put a fake server in front of the real client — see [When There Is No Repository to Fake](#when-there-is-no-repository-to-fake).

```ts title="dialog.ts"
export interface DialogRef<RESULT> {
  closed$: Observable<RESULT | undefined>;
}

export interface DialogDef {
  open<RESULT>(component: Type<unknown>): DialogRef<RESULT>;
}

@Service()
export class Dialog implements DialogDef {
  private _matDialog = inject(MatDialog);

  open<RESULT>(component: Type<unknown>): DialogRef<RESULT> {
    const ref = this._matDialog.open<unknown, unknown, RESULT>(component);
    return { closed$: ref.afterClosed() };
  }
}
```

```ts title="dialog.fake.ts"
@Service({ autoProvided: false })
export class DialogFake implements DialogDef {
  private _openDialog?: {
    component: Type<unknown>;
    close: (result: unknown) => void;
  };

  open<RESULT>(component: Type<unknown>): DialogRef<RESULT> {
    if (this._openDialog) {
      throw new Error("DialogFake: a dialog is already open.");
    }
    const closed$ = new Subject<RESULT | undefined>();
    this._openDialog = {
      component,
      close: (result) => {
        closed$.next(result as RESULT | undefined);
        closed$.complete();
      },
    };
    return { closed$ };
  }

  getOpenDialogSync(): Type<unknown> | undefined {
    return this._openDialog?.component;
  }

  close(result?: unknown) {
    if (!this._openDialog) {
      throw new Error("DialogFake: no dialog is open.");
    }
    const { close } = this._openDialog;
    this._openDialog = undefined;
    close(result);
  }
}

export function provideDialogFake(): EnvironmentProviders {
  return makeEnvironmentProviders([
    DialogFake,
    { provide: Dialog, useExisting: DialogFake },
  ]);
}
```

```ts
it("deletes recipe once confirmed", async () => {
  const { dialogFake } = mountDeleteRecipeButton();

  await page.getByRole("button", { name: "Delete" }).click();

  expect(dialogFake.getOpenDialogSync()).toBe(ConfirmDeletion);

  dialogFake.close(true);

  await expect
    .element(page.getByRole("paragraph"))
    .toHaveTextContent("Recipe deleted.");
});
```

Keep fakes self-contained: a fake never injects another fake. If two fakes need shared state, reconsider the boundaries.

## Contract Tests

A contract test runs the same suite against the real implementation and the fake, so the fake can't drift from reality.

```ts title="meal-repository.contract.ts"
export function verifyMealRepositoryContract(
  createMealRepository: () => { mealRepo: MealRepositoryDef },
) {
  const burger = recipeMother.withBasicInfo("Burger").build();
  const salad = recipeMother.withBasicInfo("Salad").build();

  it("adds recipes", async () => {
    const { mealRepo } = createMealRepository();

    await lastValueFrom(mealRepo.addMeal(burger));
    await lastValueFrom(mealRepo.addMeal(salad));

    expect(await lastValueFrom(mealRepo.getMeals())).toEqual([
      expect.objectContaining({ name: "Burger" }),
      expect.objectContaining({ name: "Salad" }),
    ]);
  });

  it("returns empty array initially", async () => {
    const { mealRepo } = createMealRepository();

    expect(await lastValueFrom(mealRepo.getMeals())).toEqual([]);
  });
}
```

```ts title="meal-repository.fake.spec.ts"
describe(MealRepositoryFake.name, () => {
  verifyMealRepositoryContract(() => {
    TestBed.configureTestingModule({ providers: [MealRepositoryFake] });
    return { mealRepo: TestBed.inject(MealRepositoryFake) };
  });
});
```

```ts title="meal-repository.spec.ts"
describe(MealRepository.name, () => {
  verifyMealRepositoryContract(createMealRepository);

  /* Implementation-specific behavior stays here. */
  it('returns empty array when storage value is invalid', async () => {
    ...
  });
});
```

## Testing the Adapters Themselves

Most tests use the fake. The real adapter still needs coverage:

- Run the contract tests against the real implementation when its infrastructure is fast and deterministic _(e.g. a repository over `LocalStorage`, itself replaced by `LocalStorageFake`)_.
- For HTTP adapters, prefer a contract test or a Wide test against a real backend _(kept in a separate project or suite if it's slow)_, or rely on end-to-end tests.
- Avoid `HttpTestingController` for a repository: it couples tests to request details of an API you don't own, and keeps passing when the backend changes. Don't rewrite existing `HttpTestingController` suites unless asked.

## When There Is No Repository to Fake

Brownfield code often calls `HttpClient` _(or `httpResource()` / `resource()` with a fetcher)_ straight from a service or component, so there is no boundary you own to fake. In order of preference:

1. **Extract a repository** _(`XRepository` + `XRepositoryDef`)_ around the HTTP calls and fake that, if the task allows touching production code. Otherwise, suggest it at the end.
2. **Stand up a fake server** and keep the real `HttpClient` _(the same `provideHttpClient()` options the application uses)_. The fake answers the request the application actually sends, so `HttpClient`, `httpResource()`, and a `resource()` loader that calls `fetch` all hit it. MSW is the usual way; a real fake server — a small HTTP server the test owns — is the other. Keep the test about the behavior the SUT exposes, and arrange the response before the SUT runs.

   A fake server still names the method and the URL, which is why step 1 comes first. `HttpTestingController` is the wrong tool here: it replaces `HttpClient`'s backend instead of answering the network.

With `httpResource()` or `resource()`, the boundary is the same: a repository that returns the resource, or the fake server when no repository exists. The component or service that reads the resource is then tested through the DOM or `expect.poll` as usual.

## Where Fakes Live

Put the fake next to the real implementation _(`recipe-repository.fake.ts` beside `recipe-repository.ts`)_. In a library of a monorepo, export it from a `testing` entry point _(e.g. `@scope/recipes/testing`)_ so other projects can reuse it without importing test code from the main entry.
