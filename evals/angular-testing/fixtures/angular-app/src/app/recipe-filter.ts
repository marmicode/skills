import { Component, output } from '@angular/core';

@Component({
  selector: 'app-recipe-filter',
  template: `
    <label>
      Keywords
      <input (input)="onInput($event)" />
    </label>
  `,
})
export class RecipeFilter {
  readonly filterChange = output<string>();

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterChange.emit(value);
  }
}
