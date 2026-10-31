import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
  globExists,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import { expectElementCall, specPasses } from "../../shared/helpers.ts";

const SPEC_PATH = "src/app/cookbook-search.browser.spec.ts";

export default defineTestCase({
  description: "shows a search failure arranged on the fake",
  vars: {
    request:
      "Write tests for CookbookSearch, including the failure when a search fails.",
  },
  assert: [
    {
      type: "javascript",
      metric: "spec-next-to-component",
      value: fileExists(SPEC_PATH),
    },
    {
      type: "javascript",
      metric: "spec-passes",
      value: specPasses(SPEC_PATH),
    },
    {
      type: "javascript",
      metric: "source-untouched",
      /* The repository is edited to extract CookbookRepositoryDef. */
      value: filesUntouched(["src/app/cookbook-search.ts"], FIXTURE_DIR),
    },
    {
      type: "javascript",
      metric: "repository-faked",
      value: globExists("src/**/cookbook-repository.fake.ts"),
    },
    {
      type: "javascript",
      metric: "error-copy",
      value: fileContains(SPEC_PATH, /Search failed/),
    },
    {
      type: "javascript",
      metric: "locators",
      value: fileContains(SPEC_PATH, /\bpage\.getBy/),
    },
    {
      type: "javascript",
      metric: "expect-element",
      value: fileContains(SPEC_PATH, expectElementCall),
    },
    {
      type: "javascript",
      metric: "suite-named-after-sut",
      value: fileContains(SPEC_PATH, /describe\(CookbookSearch,/),
    },
    {
      type: "javascript",
      metric: "no-try-catch",
      value: fileOmits(SPEC_PATH, /\btry\s*\{|\bcatch\s*\(/),
    },
    {
      type: "javascript",
      metric: "no-mock-return",
      value: fileOmits(SPEC_PATH, /\bmockReturnValue\b|\bmockRejectedValue\b/),
    },
    {
      type: "javascript",
      metric: "no-module-mocks",
      value: fileOmits(SPEC_PATH, /\bvi\.mock\(/),
    },
    {
      type: "javascript",
      metric: "no-http-testing-controller",
      value: fileOmits(SPEC_PATH, /\bHttpTestingController\b/),
    },
    {
      type: "javascript",
      metric: "no-before-each",
      value: fileOmits(SPEC_PATH, /\bbeforeEach\(/),
    },
    {
      type: "javascript",
      metric: "no-detect-changes",
      value: fileOmits(SPEC_PATH, /\.detectChanges\(/),
    },
    {
      type: "javascript",
      metric: "no-component-instance",
      value: fileOmits(SPEC_PATH, /\.componentInstance\b/),
    },
    {
      type: "llm-rubric",
      metric: "success-and-arranged-failure",
      transform: workspaceAsOutput([
        { title: "Spec", path: SPEC_PATH },
        { title: "Fake", path: "src/**/cookbook-repository.fake.ts" },
      ]),
      value: `The output is the spec and the fake. An empty spec section fails. The fake is an in-memory CookbookRepository. One test arranges cookbooks and asserts a literal name in a heading.
One test arranges a failure through the fake (a token in the keywords, a configure() flag, or similar) and asserts the visible text "Search failed".
mockReturnValue, mockRejectedValue, and try/catch fail.
Test names are one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
