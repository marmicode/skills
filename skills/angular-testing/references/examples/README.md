# Examples

Complete spec files from **Whiskmate**, the meal-planning app of the [Pragmatic Angular Testing](https://courses.marmicode.io) workshop _(Angular 21, Vitest 4.1, Browser Mode with Playwright, zoneless)_. They pass against the app, where `RecipePreview` renders an `<article>` and the `<wm-recipe-filter>` host in `RecipeSearch` has `data-testid="recipe-filter"`. The one exception is `recipe/recipe-preview.spec.ts`, an emulated-DOM variant derived from its Browser Mode sibling. Fake classes in this folder use `@Service({ autoProvided: false })`, the Angular ≥ 22.1 form of the `@Injectable()` those fakes use in the Angular 21 app.

Conventions that belong to Whiskmate, not to this skill:

- Component files use the `.ng.ts` suffix _(`recipe-search.ng.ts`)_. Follow the naming of the project you work in.
- The examples rely on Vitest's `globals: true`; `recipe/recipe-preview.spec.ts` shows the explicit `import { ... } from 'vitest'` form.
- The production code _(`meal-planner.ts`, `recipe-search.ng.ts`, `local-storage.ts`, `auth.ts`, `recipe.ts`, …)_ is intentionally absent: the examples are reading material, not a runnable project.

| File | Shows |
| --- | --- |
| `meal-planner/meal-planner.spec.ts` | Service test: setup functions, composed setup, deferred instantiation, fake, object mother, `watch()` for reactivity, `rejects.toThrow` |
| `meal-planner/meal-repository.fake.ts` | Fake + provider factory |
| `meal-planner/meal-repository.contract.ts` | Contract shared by the real repository and the fake |
| `meal-planner/meal-repository.fake.spec.ts`, `meal-planner/meal-repository.spec.ts` | Contract running against the fake and the real implementation, plus implementation-specific tests |
| `recipe/recipe-search.browser.spec.ts` | Integration test in Browser Mode: fakes at the boundaries, locators, scoped locators, `expect.element`, `expect.poll` on app state, fast-forward fake timers |
| `recipe/recipe-preview.browser.spec.ts` | Inputs with `inputBinding` and a signal, no fixture |
| `recipe/recipe-preview.spec.ts` | The same test in an emulated DOM: `screen` from `@testing-library/dom` and `expect.poll` |
| `recipe/recipe-filter.browser.spec.ts` | Outputs with `outputBinding`, debounce with manual fake timers |
| `recipe/recipe-search.shallow.browser.spec.ts` | Shallow test: child inputs through `DebugElement.properties`, child outputs through `triggerEventHandler` |
| `recipe/recipe-repository.fake.ts` | Fake with filtering logic and `defer` |
| `user/is-signed-in.guard.browser.spec.ts` | Guard test with `RouterTestingHarness` and a `Dummy` routed component |
| `shared/local-storage.fake.ts` | Fake for a browser API |
| `testing/recipe.mother.ts` | Object mother |
| `testing/watch.ts` | Helper to assert that a value is reactive |
