import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileOmits,
  filesEqual as filesUntouched,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import { INPUT_BINDING_CALL } from "../../shared/helpers.ts";
import { componentTestAssertions } from "../../shared/component-assertions.ts";

const SPEC_PATH = "src/app/weeknight-dinner.browser.spec.ts";

export default defineTestCase({
  description: "renders a simple child for real",
  vars: {
    request: "Write tests for WeeknightDinner.",
  },
  assert: [
    ...componentTestAssertions({
      specPath: SPEC_PATH,
      expected: {
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
      value: fileContains(SPEC_PATH, INPUT_BINDING_CALL),
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
