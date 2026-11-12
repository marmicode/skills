import { defineTestCase } from "../../shared/config.ts";
import {
  filesUntouched,
  globExists,
  testFileAssertions,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";

const TEST_PATH = "src/app/recipe-search.browser.spec.ts";
const TEST_PATTERN = "src/app/recipe-search*.spec.ts";

export default defineTestCase({
  description: "tests a component that loads data through a repository",
  vars: {
    request: "Write tests for the RecipeSearch component.",
  },
  assert: [
    ...testFileAssertions({
      testPath: TEST_PATTERN,
      expected: {
        testPath: TEST_PATH,
        suiteName: "RecipeSearch",
        pageLocators: true,
        expectElement: true,
      },
    }),
    {
      type: "javascript",
      metric: "source-untouched",
      /* RecipeRepository is edited to extract RecipeRepositoryDef. */
      value: filesUntouched(["src/app/recipe-search.ts"], ANGULAR_APP_BASE_DIR),
    },
    {
      type: "javascript",
      metric: "repository-faked",
      value: globExists("src/**/*.fake.ts"),
    },
    {
      type: "llm-rubric",
      threshold: 0.9,
      metric: "behavior-names-and-literals",
      transform: workspaceAsOutput([
        { title: "Spec", path: TEST_PATTERN },
        { title: "Fake", path: "src/**/*.fake.ts" },
      ]),
      value: `The output is the spec and the fake.
Each it() names one behavior, in the present tense, such as "shows recipes matching the keywords".
"should ..." and past tense fail.
Every expected value is a literal written in the assertion, such as 'Burger' or ['Burger', 'Salad'].
The same literal may also be used to arrange the fake.
Deriving the expected value from an arranged recipe, from a variable holding that recipe, or from .map() or .length on the arranged data fails.`,
    },
    {
      type: "llm-rubric",
      threshold: 0.9,
      metric: "in-memory-fake",
      transform: workspaceAsOutput([
        { title: "Spec", path: TEST_PATTERN },
        { title: "Fake", path: "src/**/*.fake.ts" },
      ]),
      value: `The output is the spec and the fake.
The fake is an in-memory RecipeRepository, and the spec arranges it through a testing helper such as setRecipes() or configure() before the component is mounted.
A vi.fn() or any other stub fails.
The spec does not assert that searchRecipes was called, or which arguments it received.`,
    },
    {
      type: "llm-rubric",
      threshold: 0.9,
      metric: "asserts-through-the-screen",
      transform: workspaceAsOutput([
        { title: "Spec", path: TEST_PATTERN },
        { title: "Fake", path: "src/**/*.fake.ts" },
      ]),
      value: `The output is the spec and the fake.
The spec asserts the recipe names rendered in headings, and the empty copy "No recipes found".
page.getByRole('heading') and page.getByText both count.
Calling a method on RecipeSearch, or reading its recipes resource or any other component property, fails.`,
    },
  ],
});
