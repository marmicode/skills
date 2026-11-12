import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileOmits,
  filesUntouched,
  testFileAssertions,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import { INPUT_BINDING_CALL } from "../../shared/helpers.ts";

const TEST_PATH = "src/app/weeknight-dinner.browser.spec.ts";
const TEST_PATTERN = "src/app/weeknight-dinner*.spec.ts";

export default defineTestCase({
  description: "renders a simple child for real",
  vars: {
    request: "Write tests for WeeknightDinner.",
  },
  assert: [
    ...testFileAssertions({
      testPath: TEST_PATTERN,
      expected: {
        testPath: TEST_PATH,
        suiteName: "WeeknightDinner",
        pageLocators: true,
        expectElement: true,
      },
    }),
    {
      type: "javascript",
      metric: "source-untouched",
      value: filesUntouched(
        ["src/app/weeknight-dinner.ts", "src/app/recipe-preview.ts"],
        ANGULAR_APP_BASE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "input-binding",
      value: fileContains(TEST_PATTERN, INPUT_BINDING_CALL),
    },
    {
      type: "javascript",
      metric: "no-shallow-schema",
      value: fileOmits(
        TEST_PATTERN,
        /\bCUSTOM_ELEMENTS_SCHEMA\b|\bNO_ERRORS_SCHEMA\b/,
      ),
    },
    {
      type: "llm-rubric",
      threshold: 0.9,
      metric: "real-child-heading",
      transform: workspaceAsOutput([{ title: "Spec", path: TEST_PATTERN }]),
      value: `The output is the spec.
The spec renders RecipePreview for real and asserts the recipe name the user sees in the heading.
The expected name is a literal.
Shallow rendering fails.
The test name is one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
