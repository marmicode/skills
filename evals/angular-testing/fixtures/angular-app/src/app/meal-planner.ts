import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MealRepository } from './meal-repository';
import { MealStore } from './meal-store';
import { Recipe } from './recipe';

@Injectable({ providedIn: 'root' })
export class MealPlanner {
  private readonly _repository = inject(MealRepository);
  private readonly _store = inject(MealStore);

  readonly recipes = this._store.recipes;

  canAddRecipe(recipe: Recipe): boolean {
    return !this._store.has(recipe.name);
  }

  async addRecipe(recipe: Recipe): Promise<void> {
    if (!this.canAddRecipe(recipe)) {
      throw new Error("Can't add recipe.");
    }
    await firstValueFrom(this._repository.save(recipe));
    this._store.add(recipe);
  }
}
