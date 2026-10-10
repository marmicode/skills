import {
  EnvironmentProviders,
  Injectable,
  makeEnvironmentProviders,
} from '@angular/core';
import { defer, Observable, of } from 'rxjs';
import { Recipe } from '../recipe/recipe';
import { MealRepository, MealRepositoryDef } from './meal-repository';

@Injectable()
export class MealRepositoryFake implements MealRepositoryDef {
  private _meals: Recipe[] = [];

  /* `defer` keeps the fake lazy, like the real repository:
   * nothing happens until the caller subscribes. */
  addMeal(meal: Recipe): Observable<void> {
    return defer(() => {
      this._meals = [...this._meals, meal];
      return of(undefined);
    });
  }

  getMeals(): Observable<Recipe[]> {
    return defer(() => of(this._meals));
  }

  /* Testing helpers. */

  setMeals(meals: Recipe[]) {
    this._meals = meals;
  }

  getMealsSync(): Recipe[] {
    return this._meals;
  }
}

export function provideMealRepositoryFake(): EnvironmentProviders {
  return makeEnvironmentProviders([
    MealRepositoryFake,
    {
      provide: MealRepository,
      useExisting: MealRepositoryFake,
    },
  ]);
}
