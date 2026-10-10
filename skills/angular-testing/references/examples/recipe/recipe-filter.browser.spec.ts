import { outputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { RecipeFilterCriteria } from './recipe-filter-criteria';
import { RecipeFilter } from './recipe-filter.ng';

/* The debounce is the behavior under test: fake timers in "manual" mode. */
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
