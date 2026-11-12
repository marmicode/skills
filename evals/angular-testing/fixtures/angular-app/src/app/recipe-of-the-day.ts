import { Component, input } from '@angular/core';
import { Recipe } from './recipe';
import { RecipePreview } from './recipe-preview';

@Component({
  selector: 'app-recipe-of-the-day',
  imports: [RecipePreview],
  template: `
    <app-recipe-preview data-testid="recipe-preview" [recipe]="recipe()" />
  `,
})
export class RecipeOfTheDay {
  readonly recipe = input.required<Recipe>();
}
