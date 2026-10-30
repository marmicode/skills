import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Recipe } from './recipe';

@Component({
  selector: 'app-seasonal-recipes',
  template: `
    @if (recipes.hasValue()) {
      @for (recipe of recipes.value(); track recipe.id) {
        <h2>{{ recipe.name }}</h2>
      } @empty {
        <p>No recipes found</p>
      }
    }
  `,
})
export class SeasonalRecipes {
  private readonly _http = inject(HttpClient);

  protected readonly recipes = rxResource({
    stream: () =>
      this._http.get<Recipe[]>('https://recipes.marmicode.test/seasonal'),
  });
}
