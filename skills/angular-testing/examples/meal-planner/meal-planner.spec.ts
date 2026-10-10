import { TestBed } from '@angular/core/testing';
import { watch } from '../testing/watch';
import { recipeMother } from '../testing/recipe.mother';
import { MealPlanner } from './meal-planner';
import {
  MealRepositoryFake,
  provideMealRepositoryFake,
} from './meal-repository.fake';

describe(MealPlanner.name, () => {
  it('adds recipes', async () => {
    const { mealPlanner, burger, salad } = createMealPlanner();

    await mealPlanner.addRecipe(burger);
    await mealPlanner.addRecipe(salad);

    expect(mealPlanner.recipes()).toEqual([
      expect.objectContaining({ name: 'Burger' }),
      expect.objectContaining({ name: 'Salad' }),
    ]);
  });

  it('does not allow recipe duplicates', async () => {
    const { mealPlanner, burgerDuplicate } =
      await createMealPlannerWithBurger();

    expect(mealPlanner.canAddRecipe(burgerDuplicate)).toBe(false);
  });

  it('throws error if recipe is already present', async () => {
    const { mealPlanner, burgerDuplicate } =
      await createMealPlannerWithBurger();

    await expect(mealPlanner.addRecipe(burgerDuplicate)).rejects.toThrow(
      `Can't add recipe.`,
    );
  });

  it('adds recipes to meal repository', async () => {
    const { mealPlanner, mealRepoFake, burger } = createMealPlanner();

    await mealPlanner.addRecipe(burger);

    expect(mealRepoFake.getMealsSync()).toEqual([
      expect.objectContaining({ name: 'Burger' }),
    ]);
  });

  it('notifies when recipes change', async () => {
    const { mealPlanner, burger, salad } = createMealPlanner();

    const recipes = watch(mealPlanner.recipes);

    await mealPlanner.addRecipe(burger);
    await mealPlanner.addRecipe(salad);

    expect(recipes()).toMatchObject([{ name: 'Burger' }, { name: 'Salad' }]);
  });

  it('fetches recipes from meal repository', async () => {
    const { getMealPlanner, mealRepoFake, burger } = setUpMealPlanner();

    mealRepoFake.setMeals([burger]);

    const mealPlanner = getMealPlanner();
    expect(mealPlanner.recipes()).toEqual([
      expect.objectContaining({ name: 'Burger' }),
    ]);
  });

  describe('canAddRecipe', () => {
    it('allows new recipes', async () => {
      const { mealPlanner, salad } = await createMealPlannerWithBurger();

      expect(mealPlanner.canAddRecipe(salad)).toBe(true);
    });

    it('updates when recipes change', async () => {
      const { mealPlanner, salad } = await createMealPlannerWithBurger();

      const canAddRecipe = watch(() => mealPlanner.canAddRecipe(salad));

      await mealPlanner.addRecipe(salad);

      expect(canAddRecipe()).toBe(false);
    });
  });

  async function createMealPlannerWithBurger() {
    const { mealPlanner, burger, ...utils } = createMealPlanner();

    await mealPlanner.addRecipe(burger);

    return {
      mealPlanner,
      ...utils,
    };
  }

  function createMealPlanner() {
    const { getMealPlanner, ...utils } = setUpMealPlanner();

    return {
      mealPlanner: getMealPlanner(),
      ...utils,
    };
  }

  function setUpMealPlanner() {
    TestBed.configureTestingModule({
      providers: [provideMealRepositoryFake()],
    });

    return {
      getMealPlanner: () => TestBed.inject(MealPlanner),
      burger: recipeMother.withBasicInfo('Burger').build(),
      burgerDuplicate: recipeMother.withBasicInfo('Burger').build(),
      salad: recipeMother.withBasicInfo('Salad').build(),
      mealRepoFake: TestBed.inject(MealRepositoryFake),
    };
  }
});
