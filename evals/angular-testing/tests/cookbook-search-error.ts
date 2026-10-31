import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileOmits,
  filesEqual as filesUntouched,
  globExists,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import { TRY_CATCH } from "../../shared/helpers.ts";
import { componentTestAssertions } from "../../shared/component-assertions.ts";

const SPEC_PATH = "src/app/cookbook-search.browser.spec.ts";

export default defineTestCase({
  description: "shows a search failure arranged on the fake",
  vars: {
    request:
      "Write tests for CookbookSearch, including the failure when a search fails.",
  },
  assert: [
    ...componentTestAssertions({
      specPath: SPEC_PATH,
      expected: {
        suiteName: "CookbookSearch",
        pageLocators: true,
        expectElement: true,
      },
    }),
    {
      type: "javascript",
      metric: "source-untouched",
      /* The repository is edited to extract CookbookRepositoryDef. */
      value: filesUntouched(
        ["src/app/cookbook-search.ts"],
        ANGULAR_APP_BASE_DIR,
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
      value: fileContains(SPEC_PATH, /Search failed/),
    },
    {
      type: "javascript",
      metric: "no-try-catch",
      value: fileOmits(SPEC_PATH, TRY_CATCH),
    },
    {
      type: "javascript",
      metric: "no-mock-return",
      value: fileOmits(SPEC_PATH, /\bmockReturnValue\b|\bmockRejectedValue\b/),
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
