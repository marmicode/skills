import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  withComponentInputBinding,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { page } from 'vitest/browser';
import { recipeRouterHelper } from '../recipe/recipe.router-helper';
import { Auth } from './auth';
import { isSignedInGuard } from './is-signed-in.guard';

describe(isSignedInGuard.name, () => {
  it('allows access to the route if user is signed in', async () => {
    const { auth, getCurrentUrl, navigate } = await mountRoutes();

    auth.signIn();

    await navigate('/meal-plan');

    expect.soft(getCurrentUrl()).toBe('/meal-plan');
    await expect
      .element(page.getByRole('heading'))
      .toHaveTextContent('Meal Plan');
  });

  it('prevents navigation if user is not signed in and has already navigated', async () => {
    const { getCurrentUrl, navigate } = await mountRoutes();

    await navigate('/landing');

    await navigate('/meal-plan');

    expect.soft(getCurrentUrl()).toBe('/landing');
    await expect
      .element(page.getByRole('heading'))
      .toHaveTextContent('Landing');
  });

  it('redirects to /search if user is not signed in and first visit', async () => {
    const { getCurrentUrl, navigate } = await mountRoutes();

    await navigate('/meal-plan');

    expect.soft(getCurrentUrl()).toBe('/search');
    await expect.element(page.getByRole('heading')).toHaveTextContent('Search');
  });

  async function mountRoutes() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            {
              path: 'landing',
              component: Dummy,
              data: { title: 'Landing' },
            },
            {
              path: recipeRouterHelper.SEARCH_PATH,
              component: Dummy,
              data: { title: 'Search' },
            },
            {
              path: 'meal-plan',
              component: Dummy,
              data: { title: 'Meal Plan' },
              canActivate: [isSignedInGuard],
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    });

    /* No initial URL: the first `navigate()` is the app's first navigation. */
    const harness = await RouterTestingHarness.create();

    return {
      auth: TestBed.inject(Auth),
      getCurrentUrl: () => TestBed.inject(Router).url,
      navigate: (
        url:
          | '/landing'
          | `/${typeof recipeRouterHelper.SEARCH_PATH}`
          | '/meal-plan',
      ) => harness.navigateByUrl(url),
    };
  }

  @Component({
    template: `<h1>{{ title() }}</h1>`,
  })
  class Dummy {
    /* Bound from the route's `data` thanks to `withComponentInputBinding()`. */
    title = input.required<string>();
  }
});
