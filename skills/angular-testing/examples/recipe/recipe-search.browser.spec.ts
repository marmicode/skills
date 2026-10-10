import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { MealPlanner } from '../meal-planner/meal-planner';
import { provideMealRepositoryFake } from '../meal-planner/meal-repository.fake';
import { recipeMother } from '../testing/recipe.mother';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from './recipe-repository.fake';
import { RecipeSearch } from './recipe-search.ng';

/* Integration test: RecipeSearch is rendered with its real children
 * (RecipeFilter, RecipePreview, RecipeAddButton) and real services (MealPlanner).
 * Only the adapters to the outside world are faked (recipe & meal repositories). */
describe(RecipeSearch.name, () => {
  it('searches recipes without filtering', async () => {
    const { recipeNames } = mountRecipeSearch();

    await expect.element(recipeNames).toHaveLength(2);
    await expect.element(recipeNames.nth(0)).toHaveTextContent('Burger');
    await expect.element(recipeNames.nth(1)).toHaveTextContent('Salad');
  });

  it('filters recipes by keywords', async () => {
    const { recipeNames, updateFilter } = mountRecipeSearch();

    await updateFilter({ keywords: 'Burg' });

    await expect.element(recipeNames).toHaveTextContent('Burger');
  });

  it('adds recipe to meal planner', async () => {
    const { getAddButton, getMealPlannerRecipeNames } = mountRecipeSearch();

    await getAddButton('Burger').click();

    await expect.poll(() => getMealPlannerRecipeNames()).toEqual(['Burger']);
  });

  it("disables add button if recipe can't be added", async () => {
    const { getAddButton } = await mountRecipeSearchWithBurgerInMealPlanner();

    await expect.element(getAddButton('Burger')).toBeDisabled();
  });

  async function mountRecipeSearchWithBurgerInMealPlanner() {
    const { mealPlanner, ...utils } = mountRecipeSearch();

    await mealPlanner.addRecipe(recipeMother.withBasicInfo('Burger').build());

    return utils;
  }

  function mountRecipeSearch() {
    /* The keywords field is debounced: fast-forward timers so delays don't slow tests down. */
    vi.useFakeTimers();
    vi.setTimerTickMode('nextTimerAsync');
    onTestFinished(() => {
      vi.useRealTimers();
    });

    TestBed.configureTestingModule({
      providers: [provideMealRepositoryFake(), provideRecipeRepositoryFake()],
    });

    TestBed.inject(RecipeRepositoryFake).setRecipes([
      recipeMother.withBasicInfo('Burger').build(),
      recipeMother.withBasicInfo('Salad').build(),
    ]);

    TestBed.createComponent(RecipeSearch);

    const mealPlanner = TestBed.inject(MealPlanner);

    return {
      mealPlanner,
      recipeNames: page.getByRole('heading'),
      /* Locate the recipe card first, then its button: no `.first()` or `.nth()`. */
      getAddButton: (recipeName: string) =>
        page
          .getByRole('article')
          .filter({ hasText: recipeName })
          .getByRole('button', { name: 'ADD' }),
      getMealPlannerRecipeNames: () =>
        mealPlanner.recipes().map((recipe) => recipe.name),
      updateFilter: ({ keywords }: { keywords: string }) =>
        page.getByLabelText('Keywords').fill(keywords),
    };
  }
});
