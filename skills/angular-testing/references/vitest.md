# Vitest

Framework-agnostic Vitest usage for this skill.

## Contents

1. [Structure and Naming](#structure-and-naming)
2. [Assertions](#assertions)
3. [Errors](#errors)
4. [Retrying Assertions](#retrying-assertions)
5. [Spies](#spies)
6. [Fake Timers](#fake-timers)
7. [Browser Mode: Locators, Actions and Assertions](#browser-mode-locators-actions-and-assertions)
8. [Browser Mode vs. Emulated DOM](#browser-mode-vs-emulated-dom)
9. [Timeouts](#timeouts)

## Structure and Naming

- Name suites after the SUT so they follow renames: `describe(MealPlanner.name, ...)`.
- Name tests after the behavior, lowercase, present tense: `it('adds recipes', ...)`, not `it('should work', ...)`.
- Plan tests with `it.todo('...')` before implementing them.
- Put the spec next to the code under test. Follow the project's file patterns _(e.g. `*.browser.spec.ts` for Browser Mode)_.

## Assertions

| Need | Use |
| --- | --- |
| Primitive | `toBe(42)` |
| Whole structure | `toEqual([...])` |
| Some properties of an object | `toMatchObject({ name: 'Burger' })` or `expect.objectContaining({ name: 'Burger' })` |
| Some items of an array, any order | `expect.arrayContaining([...])` |
| Part of a string | `expect.stringContaining('Burger')` |
| Typed partial expectation | `expect.objectContaining({ keywords: 'Burger' } satisfies Partial<Filter>)` |
| Several related checks reported together | `expect.soft(...)` |

## Errors

```ts
expect(() => cart.add(burger)).toThrow('Item already in cart.'); // pass a function, not its result
await expect(cart.checkout()).rejects.toThrow('Cart is empty.');
expect(() => parse('💥')).toThrow(ParseError); // when the error type is part of the contract
```

Never use `try/catch` in tests: the test passes when nothing throws.

## Retrying Assertions

| API | Use for |
| --- | --- |
| `await expect.element(locator).toHaveTextContent('Burger')` | DOM in Browser Mode |
| `await expect.poll(() => cart.getItems()).toEqual([...])` | any other asynchronous state |
| `const el = await vi.waitFor(() => locator.element())` | waiting for something to exist before acting |

- Always `await` them: the test can finish before a non-awaited assertion fails.
- Never wait with `setTimeout` or arbitrary sleeps.
- Polling stops at the first match:
  - Negative or unchanged expectations _(`not.toBeInTheDocument()`, `toEqual([])`, `not.toHaveBeenCalled()`)_ can pass before the system reacts. Pair them with a positive expectation that proves the update happened _(e.g. "only Burger is displayed" rather than "Salad is not displayed")_, or let the system settle first _(e.g. advance fake timers)_.
  - If a value is only valid for a moment, polling can miss a regression that happens right after.

## Spies

```ts
const onChange = vi.fn<(value: string) => void>();

// ... pass `onChange` as a callback, then act ...

expect(onChange).toHaveBeenCalledExactlyOnceWith('Burger');
expect(onChange).toHaveBeenLastCalledWith('Burger');
expect(onChange).toHaveBeenNthCalledWith(1, 'Burger');
expect(onChange).not.toHaveBeenCalled();
```

- Use spies to record outputs and callbacks.
- If the setup already triggered the spy, call `onChange.mockClear()` before acting instead of re-asserting the setup.
- Don't program return values (`mockReturnValue`, `mockImplementation`): that's a stub. Use a fake.
- `vi.spyOn(fake, 'method')` keeps the real behavior. Reserve it for the rare indirect output that the fake's state can't show, or for retrofitting tests on legacy code you are still trying to understand.
- Never `vi.mock()` modules:
  - it is less readable,
  - it is misleading: calls between functions of the same module still reach the real implementation,
  - it turns into spaghetti when tests stub different things,
  - it couples tests to Vitest.

## Fake Timers

```ts
function setUpFakeTimers() {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
}
```

- Install fake timers **before** anything schedules a timer. Mixing real and fake timers is a recipe for disaster.
- Always restore real timers with `onTestFinished`: fake timers are global.
- **Manual mode** _(default)_: time stands still until you advance it with `await vi.advanceTimersByTimeAsync(ms)`, `await vi.runAllTimersAsync()` or `await vi.runOnlyPendingTimersAsync()`. Use it when the timing **is** the behavior under test. It also pauses the timers your UI framework and libraries rely on for scheduling: flush them after mounting, or the UI never updates.
- **Fast-forward mode**: `vi.useFakeTimers().setTimerTickMode('nextTimerAsync')` _(Vitest ≥ 4.1)_ skips delays automatically. Use it when timing is just in the way.
- Only use the `*Async` APIs: they flush microtasks like real timers do.
- Approximate time: advance to `delay - 10` and `delay + 10`, not `delay - 1` and `delay`. Nested timers add extra milliseconds.
- Stick to one mode per test.
- Control the current date with `vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))`. Without fake timers, it only mocks `Date`, so no other timer is affected. Restore it with `onTestFinished(() => vi.useRealTimers())`.

## Browser Mode: Locators, Actions and Assertions

```ts
import { page } from 'vitest/browser';
```

**Locators** are lazy recipes to find elements. Creating one queries nothing; actions and `expect.element` resolve it, with retries.

Priority — use the first one that works:

1. `page.getByRole('button', { name: 'Add' })`
2. `page.getByLabelText('Keywords')`
3. `page.getByPlaceholder('Search')`
4. `page.getByText('No recipes found')`
5. `page.getByAltText(...)`, `page.getByTitle(...)`
6. `page.getByTestId('recipe-preview')` — last resort

Locators are **strict**: an action on a locator matching several elements fails. Narrow it down to what the user would look at:

```ts
page.getByRole('article').filter({ hasText: 'Burger' }).getByRole('button', { name: 'Add' });
page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Burger' }) });
```

Use `nth(i)`, `first()` and `last()` only when the position is the behavior under test.

**Actions** go through the provider _(e.g. Playwright)_, with actionability checks — the element must be visible, stable, enabled, and receive the event:

```ts
await page.getByRole('button', { name: 'Add' }).click();
await page.getByLabelText('Keywords').fill('Burger');
```

**Assertions** retry until they pass or time out:

```ts
await expect.element(page.getByRole('heading')).toHaveTextContent('Burger');
await expect.element(page.getByRole('heading')).toHaveLength(2); // number of matching elements
await expect.element(page.getByRole('button', { name: 'Add' })).toBeDisabled();
await expect.element(page.getByLabelText('Keywords')).toHaveValue('Burger');
await expect.element(page.getByRole('alert')).toBeVisible();
```

**Raw elements**, when an API needs a DOM node: `locator.element()` _(exactly one, throws otherwise)_, `locator.elements()` _(all current matches, no waiting)_, `locator.query()` _(one or `null`)_.

**"Partial" vs. "Full" Browser Mode**: DOM APIs, `fireEvent`, and Testing Library's `userEvent` run as JavaScript inside the page and skip actionability checks — a test can click a button that real users can't reach. The `page` API is "Full" Browser Mode. When migrating existing Testing Library tests, importing `userEvent` from `vitest/browser` instead of `@testing-library/user-event` routes interactions through the provider.

## Browser Mode vs. Emulated DOM

- `vitest/browser` can only be imported in Browser Mode. In jsdom or happy-dom it throws `vitest/browser can be imported only inside the Browser Mode`.
- When a project runs both, put browser-only tests in files matched by the browser configuration _(e.g. `*.browser.spec.ts`)_.
- Emulated environments can't check visibility, layout, or actionability. Prefer Browser Mode for UI tests.

## Timeouts

- Keep `testTimeout` low _(e.g. 500ms locally)_ so that tests that are not Narrow, or that wait for nothing, surface immediately.
- Never raise a timeout to make a test pass. Look for a missing `await`, an assertion that can't pass, or a dependency that should be faked.
