import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import {
  expectElementCall,
  inputBindingCall,
  specPasses,
} from "../../shared/helpers.ts";

const SPEC_PATH = "src/app/weeknight-dinner.browser.spec.ts";

export default defineTestCase({
  description: "renders a simple child for real",
  vars: {
    request: "Write tests for WeeknightDinner.",
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
        ["src/app/weeknight-dinner.ts", "src/app/recipe-preview.ts"],
        ANGULAR_APP_BASE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "input-binding",
      value: fileContains(SPEC_PATH, inputBindingCall),
    },
    {
      type: "javascript",
      metric: "locators",
      value: fileContains(SPEC_PATH, /\bpage\.getBy/),
    },
    {
      type: "javascript",
      metric: "expect-element",
      value: fileContains(SPEC_PATH, expectElementCall),
    },
    {
      type: "javascript",
      metric: "suite-named-after-sut",
      value: fileContains(SPEC_PATH, /describe\(WeeknightDinner,/),
    },
    {
      type: "javascript",
      metric: "no-shallow-schema",
      value: fileOmits(
        SPEC_PATH,
        /\bCUSTOM_ELEMENTS_SCHEMA\b|\bNO_ERRORS_SCHEMA\b/,
      ),
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
      metric: "real-child-heading",
      transform: workspaceAsOutput([{ title: "Spec", path: SPEC_PATH }]),
      value: `The output is the spec. An empty spec section fails. The spec renders RecipePreview for real and asserts the recipe name the user sees in the heading.
The expected name is a literal. The recipe input is a signal binding.
Shallow rendering, CUSTOM_ELEMENTS_SCHEMA, and MockComponent fail.
The test name is one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
