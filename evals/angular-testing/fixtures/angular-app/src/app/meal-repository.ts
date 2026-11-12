import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Recipe } from './recipe';

@Injectable({ providedIn: 'root' })
export class MealRepository {
  private readonly _http = inject(HttpClient);

  save(recipe: Recipe): Observable<Recipe> {
    return this._http.post<Recipe>(
      'https://meals.marmicode.test/meals',
      recipe,
    );
  }
}
