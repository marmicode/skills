import type { TestCase } from "promptfoo";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import {
  inputBindingCall,
  specPasses,
  workspaceRubric,
} from "../../shared/helpers.ts";

/* The skill's shallow example is named `*.shallow.browser.spec.ts`. */
const specPath = "src/app/recipe-of-the-day*.browser.spec.ts";

const testCase: TestCase = {
  description: "shallow-renders a slow shared child",
  vars: {
    request:
      "Write tests for RecipeOfTheDay. RecipePreview is widely shared and slow, so test RecipeOfTheDay without rendering RecipePreview.",
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
        ["src/app/recipe-of-the-day.ts", "src/app/recipe-preview.ts"],
        FIXTURE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "override-component",
      value: fileContains(specPath, /\boverrideComponent\(/),
    },
    {
      type: "javascript",
      metric: "custom-elements-schema",
      value: fileContains(specPath, /\bCUSTOM_ELEMENTS_SCHEMA\b/),
    },
    {
      type: "javascript",
      metric: "child-placeholder",
      value: fileContains(specPath, /\bgetByTestId\(/),
    },
    {
      type: "javascript",
      metric: "polls-the-input",
      value: fileContains(specPath, /\bexpect\.poll\(/),
    },
    {
      type: "javascript",
      metric: "input-binding",
      value: fileContains(specPath, inputBindingCall),
    },
    {
      type: "javascript",
      metric: "suite-named-after-sut",
      value: fileContains(specPath, /describe\(RecipeOfTheDay,/),
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
        metric: "reads-the-child-input",
        value: `The spec shallow-renders RecipeOfTheDay: overrideComponent drops the child and CUSTOM_ELEMENTS_SCHEMA leaves a placeholder.
It reads the recipe passed to that placeholder and expects a literal name such as 'Burger'.
MockComponent, rendering the real RecipePreview heading, and reading RecipeOfTheDay's own fields fail.
The test name is one behavior in the present tense. "should ..." fails.`,
      },
    ),
  ],
};

export default testCase;
