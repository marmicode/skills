import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  filesEqual as filesUntouched,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import {
  CALLED_WITH,
  INPUT_BINDING_CALL,
  OUTPUT_BINDING_CALL,
  VI_FN_CALL,
} from "../../shared/helpers.ts";
import { testFileAssertions } from "../../shared/component-assertions.ts";

const PREVIEW_SPEC_PATH = "src/app/recipe-preview.browser.spec.ts";
const FILTER_SPEC_PATH = "src/app/recipe-filter.browser.spec.ts";

export default defineTestCase({
  description: "binds an input signal and an output spy",
  vars: {
    request:
      "Write tests for RecipePreview and RecipeFilter. For RecipePreview, cover the heading updating when the recipe input changes.",
  },
  assert: [
    {
      type: "javascript",
      metric: "source-untouched",
      value: filesUntouched(
        ["src/app/recipe-preview.ts", "src/app/recipe-filter.ts"],
        ANGULAR_APP_BASE_DIR,
      ),
    },
    ...testFileAssertions({
      testPath: PREVIEW_SPEC_PATH,
      expected: {
        suiteName: "RecipePreview",
        pageLocators: true,
        expectElement: true,
      },
    }),
    {
      type: "javascript",
      metric: "preview-input-binding",
      value: fileContains(PREVIEW_SPEC_PATH, INPUT_BINDING_CALL),
    },
    {
      type: "javascript",
      metric: "preview-signal-set",
      value: fileContains(PREVIEW_SPEC_PATH, /\.set\(/),
    },
    ...testFileAssertions({
      testPath: FILTER_SPEC_PATH,
      expected: { suiteName: "RecipeFilter", pageLocators: true },
    }),
    {
      type: "javascript",
      metric: "filter-output-binding",
      value: fileContains(FILTER_SPEC_PATH, OUTPUT_BINDING_CALL),
    },
    {
      type: "javascript",
      metric: "filter-spy",
      value: fileContains(FILTER_SPEC_PATH, VI_FN_CALL),
    },
    {
      type: "javascript",
      metric: "filter-called-with",
      value: fileContains(FILTER_SPEC_PATH, CALLED_WITH),
    },
    {
      type: "llm-rubric",
      metric: "bindings-and-literals",
      transform: workspaceAsOutput([
        { title: "Preview", path: PREVIEW_SPEC_PATH },
        { title: "Filter", path: FILTER_SPEC_PATH },
      ]),
      value: `The output is the two specs. An empty section fails. RecipePreview sets the recipe signal with .set(...) and asserts the new heading text. The expected text is a literal such as 'Salad'.
RecipeFilter types through the keywords textbox and asserts the output spy was called with a literal string.
Reading the component instance, or subscribing to the output on the component, fails.
Test names are one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
