import {
  EnvironmentProviders,
  Service,
  makeEnvironmentProviders,
} from '@angular/core';
import { LocalStorage } from './local-storage';

@Service({ autoProvided: false })
export class LocalStorageFake implements LocalStorage {
  private _map = new Map<string, string>();

  getItem(key: string) {
    return this._map.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this._map.set(key, value);
  }
}

export function provideLocalStorageFake(): EnvironmentProviders {
  return makeEnvironmentProviders([
    LocalStorageFake,
    { provide: LocalStorage, useExisting: LocalStorageFake },
  ]);
}
