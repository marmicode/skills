# Emulated DOM (jsdom, happy-dom)

Use this when the project runs its tests in an emulated DOM and Browser Mode isn't available. Everything else in this skill still applies.

## Contents

1. [Limits](#limits)
2. [Mounting](#mounting)
3. [Querying and Asserting](#querying-and-asserting)
4. [Interacting](#interacting)
5. [Migrating to Browser Mode](#migrating-to-browser-mode)

## Limits

- `vitest/browser` _(`page`, `expect.element`)_ can't be imported.
- There is no layout, CSS, or actionability: a test can click a hidden or covered button. UI bugs that only show in a real browser go unnoticed.
- Some browser APIs are missing or behave differently _(e.g. `requestAnimationFrame` is simulated)_.

## Mounting

Same as in Browser Mode: `TestBed.createComponent(Component, { bindings })`, fixture ignored, fakes provided through `TestBed`.

## Querying and Asserting

Query with `screen` from **`@testing-library/dom`**, not `@testing-library/angular`: Angular Testing Library's async utilities _(`findBy*`, `waitFor`)_ trigger change detection, which hides synchronization bugs that would break the app once zoneless.

```ts
import { screen } from '@testing-library/dom';

await expect
  .poll(() => screen.queryAllByRole('heading').map((el) => el.textContent))
  .toEqual(['Burger']);
```

- Use the same query priority as in Browser Mode: role, label, placeholder, text, alt or title, test id.
- `findBy*` queries from `@testing-library/dom` also retry without triggering change detection.
- `toHaveTextContent()`, `toBeDisabled()`, etc. require `@testing-library/jest-dom` in the test setup file.
- Don't use `fixture.detectChanges()` or `fixture.whenStable()`: retry the assertion instead.

## Interacting

```ts
import { userEvent } from '@testing-library/user-event';

await userEvent.type(screen.getByLabelText('Keywords'), 'Burger');
await userEvent.click(screen.getByRole('button', { name: 'ADD' }));
```

With fake timers in manual mode, let `userEvent` advance them:

```ts
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });

await user.type(screen.getByLabelText('Keywords'), 'Burger');
```

## Migrating to Browser Mode

Prefer Browser Mode for component tests: see [setup.md](setup.md#browser-mode). Migrate progressively:

1. Run the existing tests in the browser _("partial" Browser Mode)_.
2. Replace the `@testing-library/user-event` import with `import { userEvent } from 'vitest/browser'` to route interactions through the browser provider.
3. Replace DOM queries and assertions with `page` locators and `expect.element` in new or flaky tests.
