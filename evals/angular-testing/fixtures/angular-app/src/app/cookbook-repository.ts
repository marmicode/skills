import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface Cookbook {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CookbookRepository {
  private readonly _http = inject(HttpClient);

  searchCookbooks(keywords: string): Observable<Cookbook[]> {
    return this._http
      .get<{ items: Cookbook[] }>(
        'https://cookbooks.marmicode.test/cookbooks',
        { params: { q: keywords } },
      )
      .pipe(map((response) => response.items));
  }
}
