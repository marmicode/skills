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
- Keep setup functions inside the `describe` they serve. Move them to file level only when several suites in the file share them.
- The samples in this skill assume `globals: true`. If the project doesn't enable it, import `describe`, `it`, `expect`, `vi` and `onTestFinished` from `'vitest'`; `page` always comes from `'vitest/browser'`.

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
  vi.useFakeTimers(); // manual mode: time stands still until the test advances it
  vi.setTimerTickMode('nextTimerAsync'); // optional fast-forward mode (Vitest ≥ 4.1): delays are skipped automatically
  onTestFinished(() => {
    vi.useRealTimers();
  });
}
```

Which mode to pick, how to flush Angular after mounting, and the full list of rules _(install before anything schedules a timer, `*Async` APIs only, approximate time, one mode per test, `vi.setSystemTime`)_ live in [time.md](time.md).

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
await expect.element(page.getByRole('heading')).toHaveTextContent('Burger'); // exact text (Vitest ≥ 5), partial on Vitest 4
await expect.element(page.getByRole('heading')).toMatchTextContent(/burger/i); // partial or regex (Vitest ≥ 5)
await expect.element(page.getByRole('heading')).toHaveLength(2); // number of matching elements
await expect.element(page.getByRole('button', { name: 'Add' })).toBeDisabled();
await expect.element(page.getByLabelText('Keywords')).toHaveValue('Burger');
await expect.element(page.getByRole('alert')).toBeVisible();
```

Pick `toHaveTextContent` when the whole text is the behavior, `toMatchTextContent` when only a fragment matters. On Vitest 4, `toHaveTextContent` is partial and `toMatchTextContent` doesn't exist: check the Vitest major version first.

**Raw elements**, when an API needs a DOM node: `locator.element()` _(exactly one, throws otherwise)_, `locator.elements()` _(all current matches, no waiting)_, `locator.query()` _(one or `null`)_.

**"Partial" vs. "Full" Browser Mode**: DOM APIs, `fireEvent`, and Testing Library's `userEvent` run as JavaScript inside the page and skip actionability checks — a test can click a button that real users can't reach. The `page` API is "Full" Browser Mode. When migrating existing Testing Library tests, importing `userEvent` from `vitest/browser` instead of `@testing-library/user-event` routes interactions through the provider.

## Browser Mode vs. Emulated DOM

`vitest/browser` can only be imported in Browser Mode; in jsdom or happy-dom it throws `vitest/browser can be imported only inside the Browser Mode`. When a project runs both, put browser-only tests in files matched by the browser configuration _(e.g. `*.browser.spec.ts`)_. What emulated environments can't do, and how to test there, is in [emulated-dom.md](emulated-dom.md).

## Timeouts

- Keep `testTimeout` low _(e.g. 500ms locally)_ so that tests that are not Narrow, or that wait for nothing, surface immediately.
- Never raise a timeout to make a test pass. Look for a missing `await`, an assertion that can't pass, or a dependency that should be faked.
