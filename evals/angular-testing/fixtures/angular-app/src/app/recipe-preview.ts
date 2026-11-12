import { Component, input } from '@angular/core';
import { Recipe } from './recipe';

@Component({
  selector: 'app-recipe-preview',
  template: `<h2>{{ recipe().name }}</h2>`,
})
export class RecipePreview {
  readonly recipe = input.required<Recipe>();
}
