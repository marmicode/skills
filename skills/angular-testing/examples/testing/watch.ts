import { computed, Signal } from '@angular/core';

/**
 * Watch a function and return a signal that notifies when the reactive result of the function changes.
 * The function must be reactive. If the function is not reactive, the signal will not notify when the result changes.
 *
 * This is useful for testing that a function is reactive.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const watchedCount = watch(() => count());
 * count.set(1);
 * expect(watchedCount()).toBe(1);
 * ```
 * @param fn - The function to watch.
 * @returns A signal that notifies when the reactive result of the function changes.
 */
export function watch<T>(fn: () => T): Signal<T> {
  const computedSignal = computed(fn);
  /* Make sure the function is executed at least once
   * to populate the computed signal's cached value. */
  computedSignal();
  return computedSignal;
}
