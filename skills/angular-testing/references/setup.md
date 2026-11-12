# Setup

Write tests with the setup the project already has. Change test configuration only when the user asks; otherwise, suggest the improvements below at the end of the task. Prefer Vitest with Analog over the Angular CLI `@angular/build:unit-test` builder.

## Contents

1. [Zoneless Test Environment](#zoneless-test-environment)
2. [Browser Mode](#browser-mode)
3. [Other Test Runners](#other-test-runners)
4. [Error Sensitivity](#error-sensitivity)
5. [Timeouts](#timeouts)

## Zoneless Test Environment

Zoneless is the default since Angular 21. Even if the app still uses Zone.js, write zoneless-ready tests: if they pass zoneless, they also pass with zones.

- With Analog _(including Nx projects that use its Vitest plugin)_, initialize the test environment with `setupTestBed()`:

```ts title="src/test-setup.ts"
/* Global styles, so that visibility and actionability checks see the real layout (Browser Mode). */
import "./styles.css";
import "@angular/compiler";
import "@testing-library/jest-dom/vitest";
import { setupTestBed } from "@analogjs/vitest-angular/setup-testbed";

/* Zoneless by default. Resets TestBed between tests, including when files share a context (`isolate: false`). */
setupTestBed();
```

- With the Angular CLI `@angular/build:unit-test` builder, add global test providers through its `providersFile` option.
- `provideZonelessChangeDetection()` is the stable name since Angular 20. On Angular 18–19, import `provideExperimentalZonelessChangeDetection()` instead.
- If the test environment is zone-based and you can't change it, turn on automatic change detection in the test instead of calling `fixture.detectChanges()`:

```ts
TestBed.configureTestingModule({
  providers: [{ provide: ComponentFixtureAutoDetect, useValue: true }],
});
```

## Browser Mode

Prefer Vitest with Analog over the Angular CLI `@angular/build:unit-test` builder. Suggest that move at the end of the task; change the runner only when asked.

**Analog** _(including Nx projects that use its Vitest plugin)_: split emulated and browser tests into two Vitest projects by file name, so both can coexist during a migration:

```ts title="vitest.config.mts"
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // ... Angular plugin (e.g. `@analogjs/vite-plugin-angular`) ...
  test: {
    globals: true,
    setupFiles: ["src/test-setup.ts"],
    testTimeout: process.env.CI ? 3_000 : 500,
    /* TestBed already isolates tests: sharing the context between test files is much faster.
     * `setupTestBed()` resets TestBed between tests.
     * Vitest 5 reads this top-level option for Browser Mode too; Vitest 4 needs `browser.isolate` (below). */
    isolate: false,
    projects: [
      {
        extends: true,
        test: {
          name: "emulated",
          environment: "jsdom",
          include: ["src/**/!(*.browser).spec.ts"],
          /* Node only: `pool` doesn't apply to Browser Mode. */
          pool: "threads",
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["src/**/*.browser.spec.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
            /* Vitest 4 only (deprecated in Vitest 5 in favor of the top-level `isolate`). */
            isolate: false,
          },
        },
      },
    ],
  },
});
```

```sh
npm install -D playwright vitest @vitest/browser-playwright
```

Browser names are provider-specific and lowercase _(`chromium` for Playwright, `chrome` for WebdriverIO)_. Tests run headless when `CI` is set, or when the name ends with `Headless` _(`chromiumHeadless`)_.

To get Playwright-specific locator options typed, add `"@vitest/browser-playwright"` to `compilerOptions.types` in `tsconfig.spec.json`.

**Angular CLI** _(Angular ≥ 21, when the project already uses `@angular/build:unit-test`)_:

```json title="angular.json"
{
  "test": {
    "builder": "@angular/build:unit-test",
    "options": {
      "runner": "vitest",
      "browsers": ["chromium"]
    }
  }
}
```

The `runnerConfig` option points the builder to a custom Vitest config when needed.

## Other Test Runners

The principles, fakes, setup functions, and assertions of this skill apply to any test runner. Only the APIs change.

**Jest** _(emulated DOM only: also follow [emulated-dom.md](emulated-dom.md))_:

| Vitest                                                                  | Jest                                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `vi.fn()`                                                               | `jest.fn()`                                                                                       |
| `vi.useFakeTimers()`, `vi.useRealTimers()`                              | `jest.useFakeTimers()`, `jest.useRealTimers()`                                                    |
| `await vi.advanceTimersByTimeAsync(ms)`, `await vi.runAllTimersAsync()` | `await jest.advanceTimersByTimeAsync(ms)`, `await jest.runAllTimersAsync()`                       |
| `onTestFinished(() => vi.useRealTimers())`                              | `afterEach(() => jest.useRealTimers())`                                                           |
| `await expect.poll(() => value).toEqual(expected)`                      | `await waitFor(() => expect(value).toEqual(expected))` with `waitFor` from `@testing-library/dom` |
| `toHaveBeenCalledExactlyOnceWith(value)`                                | `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith(value)`                                      |
| `vi.setTimerTickMode('nextTimerAsync')`                                 | not available: use [dynamic timing configuration](time.md#dynamic-timing-configuration)           |
| `page`, `expect.element`                                                | not available                                                                                     |

To migrate, run Vitestify (`npx @testmex/vitestify`) and set the project up with Vitest and Analog. Then replace `done` callbacks with promises, and `fakeAsync` with Vitest fake timers.

**Jasmine and Karma**: Karma is deprecated, so suggest migrating with Vitestify (`npx @testmex/vitestify`) to Vitest with Analog. Meanwhile, apply the same principles, fakes, and setup functions, and record outputs with `jasmine.createSpy()`.

## Error Sensitivity

Keep `TestBed`'s `rethrowApplicationErrors` option enabled _(the default)_: errors thrown while rendering or in listeners must fail tests instead of being logged and ignored.

## Timeouts

Keep `testTimeout` low locally _(e.g. 500ms)_ so slow or stuck tests surface immediately, with more room on CI.
