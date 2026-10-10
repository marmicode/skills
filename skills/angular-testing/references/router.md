# Router

## Contents

1. [Rules](#rules)
2. [Testing a Guard](#testing-a-guard)
3. [Components Using Route Params](#components-using-route-params)

## Rules

- Use the real router: `provideRouter(routes)` and `RouterTestingHarness`. Never stub `Router` or `ActivatedRoute`.
- Declare test-only routes with a tiny `Dummy` component that displays its title, rather than loading real pages.
- Assert both the URL and what the user sees. Use `expect.soft()` for the URL so both checks are reported.
- Arrange state through the real services _(e.g. `auth.signIn()`)_, or fakes for adapters.
- In Browser Mode, the real `Location` pushes state in the test page, so the URL of one test can survive into the next. If a test depends on the initial URL, add `provideLocationMocks()` from `@angular/common/testing` to keep navigation out of the browser history.

## Testing a Guard

```ts
describe(isSignedInGuard.name, () => {
  it('allows access to the route if user is signed in', async () => {
    const { auth, getCurrentUrl, navigate } = await mountRoutes();

    auth.signIn();

    await navigate('/meal-plan');

    expect.soft(getCurrentUrl()).toBe('/meal-plan');
    await expect.element(page.getByRole('heading')).toHaveTextContent('Meal Plan');
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
            { path: 'landing', component: Dummy, data: { title: 'Landing' } },
            { path: 'search', component: Dummy, data: { title: 'Search' } },
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
      navigate: (url: '/landing' | '/search' | '/meal-plan') =>
        harness.navigateByUrl(url),
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
```

Full example: [examples/user/is-signed-in.guard.browser.spec.ts](examples/user/is-signed-in.guard.browser.spec.ts).

## Components Using Route Params

- If the component receives route params as inputs _(`withComponentInputBinding()`)_, test it like any component: bind the params with `inputBinding('recipeId', () => 'rec_burger')`.
- To test navigation itself _(links, redirects, re-rendering when the same route gets a new param)_, navigate with `RouterTestingHarness` and the real routes.
