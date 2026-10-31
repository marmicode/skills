import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileOmits,
  globExists,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { testFileAssertions } from "../../shared/component-assertions.ts";

const SPEC_PATH = "src/app/seasonal-recipes.browser.spec.ts";
const COMPONENT_PATH = "src/app/seasonal-recipes.ts";

export default defineTestCase({
  description: "extracts a repository when HttpClient is called directly",
  vars: {
    request: "Write tests for SeasonalRecipes. You may change production code.",
  },
  assert: [
    ...testFileAssertions({
      testPath: SPEC_PATH,
      expected: { pageLocators: true, expectElement: true },
    }),
    {
      type: "javascript",
      metric: "http-left-the-component",
      value: fileOmits(COMPONENT_PATH, /@angular\/common\/http/),
    },
    {
      type: "javascript",
      metric: "component-uses-a-repository",
      value: fileContains(COMPONENT_PATH, /Repository/),
    },
    {
      type: "javascript",
      metric: "repository-faked",
      value: globExists("src/**/*.fake.ts"),
    },
    {
      type: "llm-rubric",
      metric: "repository-boundary",
      transform: workspaceAsOutput([
        { title: "Spec", path: SPEC_PATH },
        { title: "Component", path: COMPONENT_PATH },
        { title: "Fake", path: "src/**/*.fake.ts" },
      ]),
      value: `The output is the spec, the component, and the fake. An empty spec section fails. SeasonalRecipes no longer calls HttpClient. A repository the app owns loads the recipes, and the spec arranges an in-memory fake of that repository before the component is mounted.
The spec asserts a literal recipe name through the DOM.
HttpTestingController, a fake of HttpClient, or a hardcoded recipe list in the component fails.
The spec does not assert the request URL.`,
    },
  ],
});
