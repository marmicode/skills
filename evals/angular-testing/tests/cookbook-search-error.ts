import type { TestCase } from "promptfoo";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
  globExists,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import { specPasses, workspaceRubric } from "./helpers.ts";

const specPath = "src/app/cookbook-search.browser.spec.ts";

const testCase: TestCase = {
  description: "shows a search failure arranged on the fake",
  vars: {
    request:
      "Write tests for CookbookSearch, including the failure when a search fails.",
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
      metric: "source-untouched",
      value: filesUntouched(
        ["src/app/cookbook-search.ts", "src/app/cookbook-repository.ts"],
        FIXTURE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "repository-faked",
      value: globExists("src/**/cookbook-repository.fake.ts"),
    },
    {
      type: "javascript",
      metric: "error-copy",
      value: fileContains(specPath, /Search failed/),
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
      metric: "suite-named-after-sut",
      value: fileContains(specPath, /describe\(CookbookSearch,/),
    },
    {
      type: "javascript",
      metric: "no-try-catch",
      value: fileOmits(specPath, /\btry\s*\{|\bcatch\s*\(/),
    },
    {
      type: "javascript",
      metric: "no-mock-return",
      value: fileOmits(specPath, /\bmockReturnValue\b|\bmockRejectedValue\b/),
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
      { spec: specPath, fake: "src/**/cookbook-repository.fake.ts" },
      "The output is the spec and the fake. An empty spec section fails.",
      {
        type: "llm-rubric",
        metric: "success-and-arranged-failure",
        value: `The fake is an in-memory CookbookRepository. One test arranges cookbooks and asserts a literal name in a heading.
One test arranges a failure through the fake (a token in the keywords, a configure() flag, or similar) and asserts the visible text "Search failed".
mockReturnValue, mockRejectedValue, and try/catch fail.
Test names are one behavior in the present tense. "should ..." fails.`,
      },
    ),
  ],
};

export default testCase;
