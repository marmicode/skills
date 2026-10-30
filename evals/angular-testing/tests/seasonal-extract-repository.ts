import type { TestCase } from "promptfoo";
import {
  fileContains,
  fileExists,
  fileOmits,
  globExists,
} from "../../shared/assertions.ts";
import { specPasses, workspaceRubric } from "./helpers.ts";

const specPath = "src/app/seasonal-recipes.browser.spec.ts";
const componentPath = "src/app/seasonal-recipes.ts";

const testCase: TestCase = {
  description: "extracts a repository when HttpClient is called directly",
  vars: {
    request:
      "Write tests for SeasonalRecipes. You may change production code.",
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
      value: specPasses(specPath),
    },
    {
      type: "javascript",
      metric: "http-left-the-component",
      value: fileOmits(componentPath, /@angular\/common\/http/),
    },
    {
      type: "javascript",
      metric: "component-uses-a-repository",
      value: fileContains(componentPath, /Repository/),
    },
    {
      type: "javascript",
      metric: "repository-faked",
      value: globExists("src/**/*.fake.ts"),
    },
    {
      type: "javascript",
      metric: "locators",
      value: fileContains(specPath, /\bpage\.getBy/),
    },
    {
      type: "javascript",
      metric: "expect-element",
      value: fileContains(specPath, /\bexpect\.element\(/),
    },
    {
      type: "javascript",
      metric: "no-http-testing-controller",
      value: fileOmits(specPath, /\bHttpTestingController\b/),
    },
    {
      type: "javascript",
      metric: "no-module-mocks",
      value: fileOmits(specPath, /\bvi\.mock\(/),
    },
    {
      type: "javascript",
      metric: "no-mock-return",
      value: fileOmits(specPath, /\bmockReturnValue\b/),
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
    workspaceRubric(
      {
        spec: specPath,
        component: componentPath,
        fake: "src/**/*.fake.ts",
      },
      "The output is the spec, the component, and the fake. An empty spec section fails.",
      {
        type: "llm-rubric",
        metric: "repository-boundary",
        value: `SeasonalRecipes no longer calls HttpClient. A repository the app owns loads the recipes, and the spec arranges an in-memory fake of that repository before the component is mounted.
The spec asserts a literal recipe name through the DOM.
HttpTestingController, a fake of HttpClient, or a hardcoded recipe list in the component fails.
The spec does not assert the request URL.`,
      },
    ),
  ],
};

export default testCase;
