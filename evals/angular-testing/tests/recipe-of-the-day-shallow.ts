import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  filesEqual as filesUntouched,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import { EXPECT_POLL_CALL, INPUT_BINDING_CALL } from "../../shared/helpers.ts";
import { testFileAssertions } from "../../shared/component-assertions.ts";

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
      metric: "reads-the-child-input",
      transform: workspaceAsOutput([{ title: "Spec", path: SPEC_PATH }]),
      value: `The output is the spec. An empty spec section fails. The spec shallow-renders RecipeOfTheDay: overrideComponent drops the child and CUSTOM_ELEMENTS_SCHEMA leaves a placeholder.
It reads the recipe passed to that placeholder and expects a literal name such as 'Burger'.
MockComponent, rendering the real RecipePreview heading, and reading RecipeOfTheDay's own fields fail.
The test name is one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
