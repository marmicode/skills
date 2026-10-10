# Fakes in Angular

Why fakes beat stubs, spies and mocks: [principles.md](principles.md#test-doubles).

## Contents

1. [Anatomy of a Fake](#anatomy-of-a-fake)
2. [Providing and Configuring a Fake](#providing-and-configuring-a-fake)
3. [Arranging Before Instantiation](#arranging-before-instantiation)
4. [Simulating Errors](#simulating-errors)
5. [Faking Browser APIs](#faking-browser-apis)
6. [Wrapping What You Don't Own](#wrapping-what-you-dont-own)
7. [Contract Tests](#contract-tests)
8. [Testing the Adapters Themselves](#testing-the-adapters-themselves)

## Anatomy of a Fake

1. **Interface**: extract the public API of the real service into an interface (`RecipeRepositoryDef`). The real service and the fake both implement it, so the fake doesn't have to mimic private members or depend on infrastructure.
2. **Fake class**: `@Injectable()` — **not** `providedIn: 'root'`, so that forgetting to provide it fails loudly instead of silently using the real service.
3. **In-memory state**, shared by all methods so they stay consistent.
4. **Lazy observables**: wrap the work in `defer(...)` so nothing happens until the caller subscribes, like a real HTTP call. A SUT that forgets to subscribe then fails the test instead of passing by accident.
5. **Testing helpers**: methods to arrange (`setRecipes()`, `configure()`) and to inspect (`getMealsSync()`). Add them only when a test needs them.
6. **Explicit failures**: methods or arguments the fake doesn't support throw instead of returning `undefined`.

```ts title="recipe-repository.ts"
export interface RecipeRepositoryDef {
  search(filter?: RecipeFilterCriteria): Observable<Recipe[]>;
}

@Injectable({ providedIn: 'root' })
export class RecipeRepository implements RecipeRepositoryDef {
  private _httpClient = inject(HttpClient);
  ...
}
```

```ts title="recipe-repository.fake.ts"
@Injectable()
export class RecipeRepositoryFake implements RecipeRepositoryDef {
  private _recipes: Recipe[] = [];

  search({
    keywords,
    maxIngredientCount,
    maxStepCount,
  }: RecipeFilterCriteria = createDefaultRecipeFilterCriteria()): Observable<Recipe[]> {
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
  recipeMother.withBasicInfo('Burger').build(),
]);
```

- `useExisting` provides the **same instance** as both `RecipeRepository` and `RecipeRepositoryFake`: inject the fake by its own class, never `TestBed.inject(RecipeRepository) as RecipeRepositoryFake`.
- Configure the fake **before** the SUT reads from it: before `TestBed.createComponent(...)`, or before injecting a service that fetches in its constructor.
- Assert side effects on the fake's state, not on calls:

  ```ts
  expect(mealRepoFake.getMealsSync()).toEqual([
    expect.objectContaining({ name: 'Burger' }),
  ]);
  ```

## Arranging Before Instantiation

When the service reads its dependencies at construction time, return a getter so the test can arrange first. Arrange through the fake's testing helpers (`setMeals()`): its lazy API (`addMeal()`) does nothing until someone subscribes.

```ts
it('fetches recipes from meal repository', async () => {
  const { getMealPlanner, mealRepoFake, burger } = setUpMealPlanner();

  mealRepoFake.setMeals([burger]);

  const mealPlanner = getMealPlanner();
  expect(mealPlanner.recipes()).toEqual([
    expect.objectContaining({ name: 'Burger' }),
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
    burger: recipeMother.withBasicInfo('Burger').build(),
  };
}
```

## Simulating Errors

Give the fake a simple, documented trigger instead of reprogramming it per test:

```ts
@Injectable()
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

## Faking Browser APIs

Fakes are not only for the network. Turn the browser API into an injectable abstraction whose default implementation is the real API:

```ts title="local-storage.ts"
@Injectable({
  providedIn: 'root',
  useFactory: () => localStorage,
})
export abstract class LocalStorage {
  abstract getItem(key: string): string | null;
  abstract setItem(key: string, value: string): void;
}
```

```ts title="local-storage.fake.ts"
@Injectable()
export class LocalStorageFake implements LocalStorage {
  private _map = new Map<string, string>();

  getItem(key: string) {
    return this._map.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this._map.set(key, value);
  }
}

export function provideLocalStorageFake(): EnvironmentProviders {
  return makeEnvironmentProviders([
    LocalStorageFake,
    { provide: LocalStorage, useExisting: LocalStorageFake },
  ]);
}
```

## Wrapping What You Don't Own

Never fake Angular Material, CDK, Router, `HttpClient` or third-party SDKs directly. In order of preference:

1. **Collaborate with the real thing**: open the real `MatDialog`, interact with it through `page`, and assert the outcome. This is usually the widest Narrow test.
2. **Wrap it in your own abstraction** when the real thing makes the test too complex or slow, then fake your abstraction. Keep the abstraction tailored to your needs, not a copy of the library's API.

```ts title="dialog.ts"
export interface DialogRef<RESULT> {
  closed$: Observable<RESULT | undefined>;
}

export interface DialogDef {
  open<RESULT>(component: Type<unknown>): DialogRef<RESULT>;
}

@Injectable({ providedIn: 'root' })
export class Dialog implements DialogDef {
  private _matDialog = inject(MatDialog);

  open<RESULT>(component: Type<unknown>): DialogRef<RESULT> {
    const ref = this._matDialog.open<unknown, unknown, RESULT>(component);
    return { closed$: ref.afterClosed() };
  }
}
```

```ts title="dialog.fake.ts"
@Injectable()
export class DialogFake implements DialogDef {
  private _openDialog?: {
    component: Type<unknown>;
    close: (result: unknown) => void;
  };

  open<RESULT>(component: Type<unknown>): DialogRef<RESULT> {
    if (this._openDialog) {
      throw new Error('DialogFake: a dialog is already open.');
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
      throw new Error('DialogFake: no dialog is open.');
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
it('deletes recipe once confirmed', async () => {
  const { dialogFake } = mountDeleteRecipeButton();

  await page.getByRole('button', { name: 'Delete' }).click();

  expect(dialogFake.getOpenDialogSync()).toBe(ConfirmDeletion);

  dialogFake.close(true);

  await expect.element(page.getByRole('paragraph')).toHaveTextContent('deleted');
});
```

Keep fakes self-contained: a fake never injects another fake. If two fakes need shared state, reconsider the boundaries.

## Contract Tests

A contract test runs the same suite against the real implementation and the fake, so the fake can't drift from reality.

```ts title="meal-repository.contract.ts"
export function verifyMealRepositoryContract(
  createMealRepository: () => { mealRepo: MealRepositoryDef },
) {
  const burger = recipeMother.withBasicInfo('Burger').build();
  const salad = recipeMother.withBasicInfo('Salad').build();

  it('adds recipes', async () => {
    const { mealRepo } = createMealRepository();

    await lastValueFrom(mealRepo.addMeal(burger));
    await lastValueFrom(mealRepo.addMeal(salad));

    expect(await lastValueFrom(mealRepo.getMeals())).toEqual([
      expect.objectContaining({ name: 'Burger' }),
      expect.objectContaining({ name: 'Salad' }),
    ]);
  });

  it('returns empty array initially', async () => {
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
- Don't stub `HttpClient` with `HttpTestingController` in new tests: it couples tests to request details of an API you don't own, and keeps passing when the backend changes. Don't rewrite existing `HttpTestingController` suites unless asked.
