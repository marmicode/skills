import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RecipeRepository } from './recipe-repository';

@Component({
  selector: 'app-recipe-search',
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
export class RecipeSearch {
  readonly keywords = input('');

  private readonly _repository = inject(RecipeRepository);

  protected readonly recipes = rxResource({
    params: () => this.keywords(),
    stream: ({ params }) => this._repository.searchRecipes(params),
  });
}
