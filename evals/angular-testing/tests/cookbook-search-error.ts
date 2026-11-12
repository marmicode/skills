import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  filesUntouched,
  globExists,
  testFileAssertions,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";

const TEST_PATH = "src/app/cookbook-search.browser.spec.ts";
const TEST_PATTERN = "src/app/cookbook-search*.spec.ts";

export default defineTestCase({
  description: "shows a search failure arranged on the fake",
  vars: {
    request:
      "Write tests for CookbookSearch, including the failure when a search fails.",
  },
  assert: [
    ...testFileAssertions({
      testPath: TEST_PATTERN,
      expected: {
        testPath: TEST_PATH,
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
      value: fileContains(TEST_PATTERN, /Search failed/),
    },
    {
      type: "llm-rubric",
      threshold: 0.9,
      metric: "success-and-arranged-failure",
      transform: workspaceAsOutput([
        { title: "Spec", path: TEST_PATTERN },
        { title: "Fake", path: "src/**/cookbook-repository.fake.ts" },
      ]),
      value: `The output is the spec and the fake.
The fake is an in-memory CookbookRepository. One test arranges cookbooks and asserts a literal name in a heading.
One test arranges a failure through the fake (a token in the keywords, a configure() flag, or similar).
Test names are one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
