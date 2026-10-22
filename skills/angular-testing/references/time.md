# Time

Debounce, throttling, delays, polling, auto-dismissed toasts, dates.

## Contents

1. [Decide First](#decide-first)
2. [Testing the Timing Itself: Manual Mode](#testing-the-timing-itself-manual-mode)
3. [Skipping Delays: Fast-Forward Mode](#skipping-delays-fast-forward-mode)
4. [Dynamic Timing Configuration](#dynamic-timing-configuration)
5. [Rules](#rules)

## Decide First

1. **Must the other timers keep running for real?** _(e.g. fake timers break something else in the exercised code)_ → [Dynamic timing configuration](#dynamic-timing-configuration).
2. **Is the timing the behavior under test?** _("no search before 300ms", "toast disappears after 5s")_ → fake timers in [manual mode](#testing-the-timing-itself-manual-mode).
3. **Otherwise the timing is just in the way** → fake timers in [fast-forward mode](#skipping-delays-fast-forward-mode), so that changing a debounce doesn't break or slow down unrelated tests.

## Testing the Timing Itself: Manual Mode

In manual mode _(Vitest's default)_, time stands still until the test advances it. That also pauses Angular's own scheduling: flush it right after mounting.

```ts
describe(RecipeFilter.name, () => {
  it('does not trigger filterChange output before debounce', async () => {
    const { filterChangeSpy, setInputValue } = await mountRecipeFilter();

    await setInputValue('Keywords', 'Cauliflower');

    /* Debounce is 300ms: stay ~10ms away from the boundary. */
    await vi.advanceTimersByTimeAsync(290);

    expect(filterChangeSpy).not.toHaveBeenCalled();
  });

  it('triggers filterChange output after debounce', async () => {
    const { filterChangeSpy, setInputValue } = await mountRecipeFilter();

    await setInputValue('Keywords', 'Cauliflower');

    await vi.advanceTimersByTimeAsync(310);

    expect(filterChangeSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        keywords: 'Cauliflower',
      } satisfies Partial<RecipeFilterCriteria>),
    );
  });

  async function mountRecipeFilter() {
    /* Install fake timers before creating the component... */
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });

    const filterChangeSpy = vi.fn<(filter: RecipeFilterCriteria) => void>();

    TestBed.createComponent(RecipeFilter, {
      bindings: [
        outputBinding<RecipeFilterCriteria>('filterChange', filterChangeSpy),
      ],
    });

    /* ...then flush Angular's pending synchronization (paused by fake timers). */
    await vi.runAllTimersAsync();

    return {
      filterChangeSpy,
      setInputValue: (
        label: 'Keywords' | 'Max Ingredients' | 'Max Steps',
        value: string,
      ) => page.getByLabelText(label).fill(value),
    };
  }
});
```

Without that flush, Angular can't render: locator actions time out and `fixture.whenStable()` never resolves.

If the component starts its own timers when it's created _(an interval, an auto-dismissed toast)_, `vi.runAllTimersAsync()` would run them too, and it gives up after 10,000 timers with intervals. Flush with a bounded `await vi.advanceTimersByTimeAsync(0)` instead, then advance time explicitly.

## Skipping Delays: Fast-Forward Mode

In fast-forward mode, the fake clock advances on its own as soon as a timer is scheduled. Delays are skipped without the test knowing their durations. It requires Vitest ≥ 4.1 and works with `expect.element` and `expect.poll`.

```ts
it('filters recipes by keywords', async () => {
  const { recipeNames, updateFilter } = mountRecipeSearch();

  await updateFilter({ keywords: 'Burg' }); // debounced, but no waiting

  await expect.element(recipeNames).toHaveTextContent('Burger');
});

function mountRecipeSearch() {
  vi.useFakeTimers();
  vi.setTimerTickMode('nextTimerAsync');
  onTestFinished(() => {
    vi.useRealTimers();
  });

  TestBed.configureTestingModule({ ... });

  TestBed.createComponent(RecipeSearch);

  return { ... };
}
```

Fast-forward mode is not synchronous: it advances time in a macrotask, so it applies once the test awaits something.

## Dynamic Timing Configuration

Make durations injectable, and let tests make them instant or endless. No timer is intercepted, so Angular's scheduling runs normally, and tests don't depend on the testing framework.

```ts title="forms-timing.config.ts"
/* Angular ≥ 22.1. Before that: @Injectable({ providedIn: 'root' }). */
@Service()
export class FormsTimingConfig {
  inputDebounce = 300;
}

export function provideFormsTimingConfig(config: FormsTimingConfig): Provider[] {
  return [{ provide: FormsTimingConfig, useValue: config }];
}

const MAX_TIMEOUT = Math.pow(2, 31) - 1;

export function provideTestingFormsTimingConfig(
  mode: 'instant-debounce' | 'never-ending-debounce',
) {
  return provideFormsTimingConfig({
    inputDebounce: mode === 'instant-debounce' ? 0 : MAX_TIMEOUT,
  });
}
```

```ts
it('disables submit button while waiting for debounce', async () => {
  TestBed.configureTestingModule({
    providers: [provideTestingFormsTimingConfig('never-ending-debounce')],
  });

  // ... mount the component and fill the form ...

  await expect.element(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
});
```

Trade-off: with different durations than production, things can run in a different order _(e.g. an auto-save and a debounce)_. Angular Material's `MATERIAL_ANIMATIONS` token is a real-life example of this approach.

## Rules

- Install fake timers **before** creating components or services, never in the middle of a test.
- Always restore real timers with `onTestFinished(() => vi.useRealTimers())`.
- Only use the `*Async` APIs: `advanceTimersByTimeAsync`, `runAllTimersAsync`, `runOnlyPendingTimersAsync`. The synchronous ones skip microtasks and produce impossible behavior.
- Approximate time _(`delay - 10`, `delay + 10`)_: nested timers add extra milliseconds.
- Stick to one mode per test.
- When an error is expected after a delay, set up `await expect(promise).rejects.toThrow(...)` **before** advancing time, or use fast-forward mode: in manual mode, a promise that rejects during `vi.advanceTimersByTimeAsync(...)` becomes an unhandled rejection before the assertion can catch it.
- Never use `fakeAsync`, `tick()`, `flush()` or `waitForAsync`: they depend on Zone.js. Vitest fake timers work with and without zones.
- Control the current date with `vi.setSystemTime(...)`. Without fake timers, it only mocks `Date` and doesn't pause Angular. Restore it with `onTestFinished(() => vi.useRealTimers())`.
