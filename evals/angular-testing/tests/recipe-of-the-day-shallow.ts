import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import { inputBindingCall, specPasses } from "../../shared/helpers.ts";

const SPEC_PATH = "src/app/recipe-of-the-day.browser.spec.ts";

export default defineTestCase({
  description: "shallow-renders a slow shared child",
  vars: {
    request:
      "Write tests for RecipeOfTheDay. RecipePreview is widely shared and slow, so test RecipeOfTheDay without rendering RecipePreview.",
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
      value: fileContains(SPEC_PATH, /\bexpect\.poll\(/),
    },
    {
      type: "javascript",
      metric: "input-binding",
      value: fileContains(SPEC_PATH, inputBindingCall),
    },
    {
      type: "javascript",
      metric: "suite-named-after-sut",
      value: fileContains(SPEC_PATH, /describe\(RecipeOfTheDay,/),
    },
    {
      type: "javascript",
      metric: "no-mock-component",
      value: fileOmits(SPEC_PATH, /\bMockComponent\b/),
    },
    {
      type: "javascript",
      metric: "no-set-input",
      value: fileOmits(SPEC_PATH, /\.setInput\(/),
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
      metric: "reads-the-child-input",
      transform: workspaceAsOutput([{ title: "Spec", path: SPEC_PATH }]),
      value: `The output is the spec. An empty spec section fails. The spec shallow-renders RecipeOfTheDay: overrideComponent drops the child and CUSTOM_ELEMENTS_SCHEMA leaves a placeholder.
It reads the recipe passed to that placeholder and expects a literal name such as 'Burger'.
MockComponent, rendering the real RecipePreview heading, and reading RecipeOfTheDay's own fields fail.
The test name is one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
