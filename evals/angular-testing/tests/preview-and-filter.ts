import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  filesUntouched,
  testFileAssertions,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import {
  CALLED_WITH,
  INPUT_BINDING_CALL,
  OUTPUT_BINDING_CALL,
  VI_FN_CALL,
} from "../../shared/helpers.ts";

const PREVIEW_TEST_PATH = "src/app/recipe-preview.browser.spec.ts";
const PREVIEW_TEST_PATTERN = "src/app/recipe-preview*.spec.ts";
const FILTER_TEST_PATH = "src/app/recipe-filter.browser.spec.ts";
const FILTER_TEST_PATTERN = "src/app/recipe-filter*.spec.ts";

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
      testPath: PREVIEW_TEST_PATTERN,
      expected: {
        testPath: PREVIEW_TEST_PATH,
        suiteName: "RecipePreview",
        pageLocators: true,
        expectElement: true,
      },
    }),
    {
      type: "javascript",
      metric: "preview-input-binding",
      value: fileContains(PREVIEW_TEST_PATTERN, INPUT_BINDING_CALL),
    },
    {
      type: "javascript",
      metric: "preview-signal-set",
      value: fileContains(PREVIEW_TEST_PATTERN, /\.set\(/),
    },
    ...testFileAssertions({
      testPath: FILTER_TEST_PATTERN,
      expected: {
        testPath: FILTER_TEST_PATH,
        suiteName: "RecipeFilter",
        pageLocators: true,
      },
    }),
    {
      type: "javascript",
      metric: "filter-output-binding",
      value: fileContains(FILTER_TEST_PATTERN, OUTPUT_BINDING_CALL),
    },
    {
      type: "javascript",
      metric: "filter-spy",
      value: fileContains(FILTER_TEST_PATTERN, VI_FN_CALL),
    },
    {
      type: "javascript",
      metric: "filter-called-with",
      value: fileContains(FILTER_TEST_PATTERN, CALLED_WITH),
    },
    {
      type: "llm-rubric",
      threshold: 0.9,
      metric: "bindings-and-literals",
      transform: workspaceAsOutput([
        { title: "Preview", path: PREVIEW_TEST_PATTERN },
        { title: "Filter", path: FILTER_TEST_PATTERN },
      ]),
      value: `The output is the two specs.
RecipePreview asserts the new heading text. The expected text is a literal such as 'Salad'.
RecipeFilter types through the keywords textbox, and the output spy is called with a literal string.
Subscribing to the output on the component fails.
Test names are one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
