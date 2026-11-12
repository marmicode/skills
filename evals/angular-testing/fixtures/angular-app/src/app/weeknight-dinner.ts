import { Component, input } from '@angular/core';
import { Recipe } from './recipe';
import { RecipePreview } from './recipe-preview';

@Component({
  selector: 'app-weeknight-dinner',
  imports: [RecipePreview],
  template: `<app-recipe-preview [recipe]="recipe()" />`,
})
export class WeeknightDinner {
  readonly recipe = input.required<Recipe>();
}
