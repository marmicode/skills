/* Emulated DOM (jsdom / happy-dom) variant of `recipe-preview.browser.spec.ts`:
 * `screen` from `@testing-library/dom` replaces `page`, `expect.poll` replaces `expect.element`.
 * Everything else (no fixture, bindings, object mother) is identical.
 *
 * Derived from the Browser Mode example; not run against Whiskmate, which only uses Browser Mode.
 * Imports from 'vitest' are explicit here; the other examples rely on `globals: true`. */
import { inputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { recipeMother } from '../testing/recipe.mother';
import { RecipePreview } from './recipe-preview.ng';

describe(RecipePreview.name, () => {
  it('shows recipe name', async () => {
    const { getRecipeName } = mountRecipePreview();

    await expect.poll(() => getRecipeName()).toBe('Burger');
  });

  it('shows the new recipe when the input changes', async () => {
    const { recipe, getRecipeName } = mountRecipePreview();

    recipe.set(recipeMother.withBasicInfo('Salad').build());

    await expect.poll(() => getRecipeName()).toBe('Salad');
  });

  function mountRecipePreview() {
    const recipe = signal(recipeMother.withBasicInfo('Burger').build());

    TestBed.createComponent(RecipePreview, {
      bindings: [inputBinding('recipe', recipe)],
    });

    return {
      recipe,
      /* `queryByRole` returns `null` until the view is rendered: `expect.poll` retries. */
      getRecipeName: () => screen.queryByRole('heading')?.textContent?.trim(),
    };
  }
});
