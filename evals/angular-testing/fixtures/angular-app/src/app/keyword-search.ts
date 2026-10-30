import { Component, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';

const DEBOUNCE_MS = 300;

@Component({
  selector: 'app-keyword-search',
  template: `
    <label>
      Keywords
      <input (input)="onInput($event)" />
    </label>
  `,
})
export class KeywordSearch {
  readonly filterChange = output<string>();

  private readonly _keywords = new Subject<string>();

  constructor() {
    this._keywords
      .pipe(debounceTime(DEBOUNCE_MS), takeUntilDestroyed())
      .subscribe((keywords) => this.filterChange.emit(keywords));
  }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this._keywords.next(value);
  }
}
