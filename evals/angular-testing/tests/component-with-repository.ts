import { join } from "node:path";
import type { Assertion, TestCase } from "promptfoo";
import { $ } from "zx";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
  globExists,
  workspaceAsOutput,
  workspaceDir,
} from "../../shared/assertions.ts";
import { expectElementCall } from "../../shared/helpers.ts";

const fixtureDir = join(import.meta.dirname, "../fixtures/angular-app");
const specPath = "src/app/recipe-search.browser.spec.ts";

/* llm-rubric grades the agent's message. Feed it the files instead. */
const gradeWorkspace = workspaceAsOutput({
  spec: "src/app/recipe-search*.spec.ts",
  fake: "src/**/*.fake.ts",
});

const testCase: TestCase = {
  description: "tests a component that loads data through a repository",
  vars: {
    request: "Write tests for the RecipeSearch component.",
  },
  assert: [
    {
      type: "javascript",
      metric: "spec-next-to-component",
      value: fileExists(specPath),
    },
    {
      type: "javascript",
      metric: "spec-passes",
      value: async (_, context) => {
        const result = await $({
          cwd: workspaceDir(context),
          quiet: true,
          nothrow: true,
        })`pnpm vitest run ${specPath}`;
        if (result.ok) return true;
        return { pass: false, score: 0, reason: result.stdall };
      },
    },
    {
      type: "javascript",
      metric: "source-untouched",
      /* RecipeRepository is edited to extract RecipeRepositoryDef. */
      value: filesUntouched(["src/app/recipe-search.ts"], fixtureDir),
    },
    {
      type: "javascript",
      metric: "repository-faked",
      value: globExists("src/**/*.fake.ts"),
    },
    {
      type: "javascript",
      metric: "browser-mode-locators",
      value: fileContains(specPath, /\bpage\.getBy/),
    },
    {
      type: "javascript",
      metric: "expect-element",
      value: fileContains(specPath, expectElementCall),
    },
    {
      type: "javascript",
      metric: "suite-named-after-sut",
      value: fileContains(specPath, /describe\(RecipeSearch,/),
    },
    {
      type: "javascript",
      metric: "no-before-each",
      value: fileOmits(specPath, /\bbeforeEach\(/),
    },
    {
      type: "javascript",
      metric: "no-detect-changes",
      value: fileOmits(specPath, /\.detectChanges\(/),
    },
    {
      type: "javascript",
      metric: "no-component-instance",
      value: fileOmits(specPath, /\.componentInstance\b/),
    },
    {
      type: "javascript",
      metric: "no-module-mocks",
      value: fileOmits(specPath, /\bvi\.mock\(/),
    },
    {
      type: "javascript",
      metric: "no-http-testing-controller",
      value: fileOmits(specPath, /\bHttpTestingController\b/),
    },
    {
      type: "javascript",
      metric: "no-query-selector",
      value: fileOmits(specPath, /\bquerySelector(All)?\(/),
    },
    defineRubric({
      type: "llm-rubric",
      metric: "behavior-names-and-literals",
      value: `Each it() names one behavior, in the present tense, such as "shows recipes matching the keywords".
"should ..." and past tense fail.
Every expected value is a literal written in the assertion, such as 'Burger' or ['Burger', 'Salad'].
The same literal may also be used to arrange the fake.
Deriving the expected value from an arranged recipe, from a variable holding that recipe, or from .map() or .length on the arranged data fails.`,
    }),
    defineRubric({
      type: "llm-rubric",
      metric: "in-memory-fake",
      value: `The fake is an in-memory RecipeRepository, and the spec arranges it through a testing helper such as setRecipes() or configure() before the component is mounted.
A vi.fn(), mockReturnValue, useValue method map, or any other stub fails.
The spec does not assert that searchRecipes was called, or which arguments it received.`,
    }),
    defineRubric({
      type: "llm-rubric",
      metric: "asserts-through-the-screen",
      value: `The spec asserts what a user sees: the recipe names rendered in headings, and the empty copy "No recipes found".
page.getByRole('heading') and page.getByText both count.
Calling a method on RecipeSearch, or reading its recipes resource or any other component property, fails.`,
    }),
  ],
};

function defineRubric(assertion: Assertion): Assertion {
  return {
    ...assertion,
    type: "llm-rubric",
    transform: gradeWorkspace,
    value: `The output is the spec and the fake. An empty spec section fails. ${assertion.value}`,
  };
}

export default testCase;
