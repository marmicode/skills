import { CUSTOM_ELEMENTS_SCHEMA, DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { recipeMother } from '../testing/recipe.mother';
import { RecipeFilterCriteria } from './recipe-filter-criteria';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from './recipe-repository.fake';
import { RecipeSearch } from './recipe-search.ng';

/* Shallow test: RecipeSearch is rendered without its children.
 * The test checks what it passes to the children's inputs
 * and how it reacts to the children's outputs. */
describe(RecipeSearch.name, () => {
  it('passes found recipes to recipe previews', async () => {
    const { getRecipePreviewNames } = mountRecipeSearch();

    await expect
      .poll(() => getRecipePreviewNames())
      .toEqual(['Burger', 'Salad']);
  });

  it('searches recipes using the filter emitted by recipe filter', async () => {
    const { getRecipePreviewNames, updateFilter } = mountRecipeSearch();

    await updateFilter({
      keywords: 'Burg',
      maxIngredientCount: null,
      maxStepCount: null,
    });

    await expect.poll(() => getRecipePreviewNames()).toEqual(['Burger']);
  });

  function mountRecipeSearch() {
    TestBed.configureTestingModule({
      providers: [provideRecipeRepositoryFake()],
    });

    TestBed.overrideComponent(RecipeSearch, {
      set: {
        /* Whitelist what the template needs (e.g. pipes), drop child components. */
        imports: [],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      },
    });

    TestBed.inject(RecipeRepositoryFake).setRecipes([
      recipeMother.withBasicInfo('Burger').build(),
      recipeMother.withBasicInfo('Salad').build(),
    ]);

    TestBed.createComponent(RecipeSearch);

    return {
      getRecipePreviewNames: () =>
        page
          .getByTestId('recipe-preview')
          .elements()
          .map((el) => new DebugElement(el).properties['recipe'].name),
      updateFilter: async (filter: RecipeFilterCriteria) => {
        const filterEl = await vi.waitFor(() =>
          page.getByTestId('recipe-filter').element(),
        );
        new DebugElement(filterEl).triggerEventHandler('filterChange', filter);
      },
    };
  }
});
