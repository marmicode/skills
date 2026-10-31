import type { TestCase } from "promptfoo";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import {
  expectElementCall,
  inputBindingCall,
  specPasses,
  workspaceRubric,
} from "../../shared/helpers.ts";

const specPath = "src/app/weeknight-dinner.browser.spec.ts";

const testCase: TestCase = {
  description: "renders a simple child for real",
  vars: {
    request: "Write tests for WeeknightDinner.",
  },
  assert: [
    {
      type: "javascript",
      metric: "spec-next-to-component",
      value: fileExists(specPath),
    },
    {
      type: "javascript",
      metric: "spec-passes",
      value: specPasses(specPath),
    },
    {
      type: "javascript",
      metric: "source-untouched",
      value: filesUntouched(
        ["src/app/weeknight-dinner.ts", "src/app/recipe-preview.ts"],
        FIXTURE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "input-binding",
      value: fileContains(specPath, inputBindingCall),
    },
    {
      type: "javascript",
      metric: "locators",
      value: fileContains(specPath, /\bpage\.getBy/),
    },
    {
      type: "javascript",
      metric: "expect-element",
      value: fileContains(specPath, expectElementCall),
    },
    {
      type: "javascript",
      metric: "suite-named-after-sut",
      value: fileContains(specPath, /describe\(WeeknightDinner,/),
    },
    {
      type: "javascript",
      metric: "no-shallow-schema",
      value: fileOmits(
        specPath,
        /\bCUSTOM_ELEMENTS_SCHEMA\b|\bNO_ERRORS_SCHEMA\b/,
      ),
    },
    {
      type: "javascript",
      metric: "no-mock-component",
      value: fileOmits(specPath, /\bMockComponent\b/),
    },
    {
      type: "javascript",
      metric: "no-set-input",
      value: fileOmits(specPath, /\.setInput\(/),
    },
    {
      type: "javascript",
      metric: "no-before-each",
      value: fileOmits(specPath, /\bbeforeEach\(/),
    },
    {
      type: "javascript",
      metric: "no-detect-changes",
      value: fileOmits(specPath, /\.detectChanges\(/),
    },
    {
      type: "javascript",
      metric: "no-component-instance",
      value: fileOmits(specPath, /\.componentInstance\b/),
    },
    workspaceRubric(
      { spec: specPath },
      "The output is the spec. An empty spec section fails.",
      {
        type: "llm-rubric",
        metric: "real-child-heading",
        value: `The spec renders RecipePreview for real and asserts the recipe name the user sees in the heading.
The expected name is a literal. The recipe input is a signal binding.
Shallow rendering, CUSTOM_ELEMENTS_SCHEMA, and MockComponent fail.
The test name is one behavior in the present tense. "should ..." fails.`,
      },
    ),
  ],
};

export default testCase;
