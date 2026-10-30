import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CookbookRepository } from './cookbook-repository';

@Component({
  selector: 'app-cookbook-search',
  template: `
    @if (cookbooks.error()) {
      <p>Search failed</p>
    } @else if (cookbooks.hasValue()) {
      @for (cookbook of cookbooks.value(); track cookbook.id) {
        <h2>{{ cookbook.name }}</h2>
      } @empty {
        <p>No cookbooks found</p>
      }
    }
  `,
})
export class CookbookSearch {
  readonly keywords = input('');

  private readonly _repository = inject(CookbookRepository);

  protected readonly cookbooks = rxResource({
    params: () => this.keywords(),
    stream: ({ params }) => this._repository.searchCookbooks(params),
  });
}
