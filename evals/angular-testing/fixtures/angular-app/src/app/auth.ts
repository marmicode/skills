import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly _signedIn = signal(false);

  isSignedIn(): boolean {
    return this._signedIn();
  }

  signIn() {
    this._signedIn.set(true);
  }
}
