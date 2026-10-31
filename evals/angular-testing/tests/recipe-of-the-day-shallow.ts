import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  filesUntouched,
  testFileAssertions,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import { EXPECT_POLL_CALL, INPUT_BINDING_CALL } from "../../shared/helpers.ts";

const SPEC_PATH = "src/app/recipe-of-the-day.browser.spec.ts";

export default defineTestCase({
  description: "shallow-renders a slow shared child",
  vars: {
    request:
      "Write tests for RecipeOfTheDay. RecipePreview is slow, so test RecipeOfTheDay without rendering RecipePreview.",
  },
  assert: [
    ...testFileAssertions({
      testPath: SPEC_PATH,
      expected: { suiteName: "RecipeOfTheDay" },
    }),
    {
      type: "javascript",
      metric: "source-untouched",
      value: filesUntouched(
        ["src/app/recipe-of-the-day.ts", "src/app/recipe-preview.ts"],
        ANGULAR_APP_BASE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "override-component",
      value: fileContains(SPEC_PATH, /\boverrideComponent\(/),
    },
    {
      type: "javascript",
      metric: "custom-elements-schema",
      value: fileContains(SPEC_PATH, /\bCUSTOM_ELEMENTS_SCHEMA\b/),
    },
    {
      type: "javascript",
      metric: "child-placeholder",
      value: fileContains(SPEC_PATH, /\bgetByTestId\(/),
    },
    {
      type: "javascript",
      metric: "polls-the-input",
      value: fileContains(SPEC_PATH, EXPECT_POLL_CALL),
    },
    {
      type: "javascript",
      metric: "input-binding",
      value: fileContains(SPEC_PATH, INPUT_BINDING_CALL),
    },
    {
      type: "llm-rubric",
      threshold: 0.9,
      metric: "reads-the-child-input",
      transform: workspaceAsOutput([{ title: "Spec", path: SPEC_PATH }]),
      value: `The output is the spec.
It expects a literal recipe name such as 'Burger' on the placeholder.
Rendering the real RecipePreview heading fails.
The test name is one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
