import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Recipe } from './recipe';

@Injectable({ providedIn: 'root' })
export class CatalogRepository {
  private readonly _http = inject(HttpClient);

  searchRecipes(keywords: string): Observable<Recipe[]> {
    return this._http
      .get<{ items: Recipe[] }>('https://catalog.marmicode.test/recipes', {
        params: { q: keywords },
      })
      .pipe(map((response) => response.items));
  }
}
