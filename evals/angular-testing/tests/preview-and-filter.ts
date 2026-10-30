import type { TestCase } from "promptfoo";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import { specPasses, workspaceRubric } from "./helpers.ts";

const previewSpec = "src/app/recipe-preview.browser.spec.ts";
const filterSpec = "src/app/recipe-filter.browser.spec.ts";

const testCase: TestCase = {
  description: "binds an input signal and an output spy",
  vars: {
    request:
      "Write tests for RecipePreview and RecipeFilter. For RecipePreview, cover the heading updating when the recipe input changes.",
  },
  assert: [
    {
      type: "javascript",
      metric: "preview-spec",
      value: fileExists(previewSpec),
    },
    {
      type: "javascript",
      metric: "filter-spec",
      value: fileExists(filterSpec),
    },
    {
      type: "javascript",
      metric: "spec-passes",
      value: specPasses([previewSpec, filterSpec]),
    },
    {
      type: "javascript",
      metric: "source-untouched",
      value: filesUntouched(
        ["src/app/recipe-preview.ts", "src/app/recipe-filter.ts"],
        FIXTURE_DIR,
      ),
    },
    ..._componentChecks(previewSpec, "preview", true),
    {
      type: "javascript",
      metric: "preview-input-binding",
      value: fileContains(previewSpec, /\binputBinding\(/),
    },
    {
      type: "javascript",
      metric: "preview-signal-set",
      value: fileContains(previewSpec, /\.set\(/),
    },
    {
      type: "javascript",
      metric: "preview-suite-name",
      value: fileContains(previewSpec, /describe\(RecipePreview,/),
    },
    {
      type: "javascript",
      metric: "preview-no-set-input",
      value: fileOmits(previewSpec, /\.setInput\(/),
    },
    ..._componentChecks(filterSpec, "filter", false),
    {
      type: "javascript",
      metric: "filter-output-binding",
      value: fileContains(filterSpec, /\boutputBinding\(/),
    },
    {
      type: "javascript",
      metric: "filter-spy",
      value: fileContains(filterSpec, /\bvi\.fn\(/),
    },
    {
      type: "javascript",
      metric: "filter-called-with",
      value: fileContains(filterSpec, /toHaveBeenCalled/),
    },
    {
      type: "javascript",
      metric: "filter-suite-name",
      value: fileContains(filterSpec, /describe\(RecipeFilter,/),
    },
    workspaceRubric(
      { preview: previewSpec, filter: filterSpec },
      "The output is the two specs. An empty section fails.",
      {
        type: "llm-rubric",
        metric: "bindings-and-literals",
        value: `RecipePreview sets the recipe signal with .set(...) and asserts the new heading text. The expected text is a literal such as 'Salad'.
RecipeFilter types through the keywords textbox and asserts the output spy was called with a literal string.
Reading the component instance, or subscribing to the output on the component, fails.
Test names are one behavior in the present tense. "should ..." fails.`,
      },
    ),
  ],
};

function _componentChecks(
  specPath: string,
  prefix: string,
  expectElement: boolean,
) {
  return [
    {
      type: "javascript" as const,
      metric: `${prefix}-locators`,
      value: fileContains(specPath, /\bpage\.getBy/),
    },
    ...(expectElement
      ? [
          {
            type: "javascript" as const,
            metric: `${prefix}-expect-element`,
            value: fileContains(specPath, /\bexpect\.element\(/),
          },
        ]
      : []),
    {
      type: "javascript" as const,
      metric: `${prefix}-no-before-each`,
      value: fileOmits(specPath, /\bbeforeEach\(/),
    },
    {
      type: "javascript" as const,
      metric: `${prefix}-no-detect-changes`,
      value: fileOmits(specPath, /\.detectChanges\(/),
    },
    {
      type: "javascript" as const,
      metric: `${prefix}-no-component-instance`,
      value: fileOmits(specPath, /\.componentInstance\b/),
    },
  ];
}

export default testCase;
