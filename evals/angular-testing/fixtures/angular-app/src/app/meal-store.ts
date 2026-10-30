import { Injectable, signal } from '@angular/core';
import { Recipe } from './recipe';

@Injectable({ providedIn: 'root' })
export class MealStore {
  private readonly _recipes = signal<Recipe[]>([]);

  readonly recipes = this._recipes.asReadonly();

  add(recipe: Recipe) {
    this._recipes.update((recipes) => [...recipes, recipe]);
  }

  has(name: string): boolean {
    return this._recipes().some((recipe) => recipe.name === name);
  }
}
