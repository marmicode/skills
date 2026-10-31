import type { TestCase } from "promptfoo";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
  globAbsent,
  globExists,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import { specPasses, workspaceRubric } from "../../shared/helpers.ts";

const specPath = "src/app/meal-planner.spec.ts";

const testCase: TestCase = {
  description: "tests a service with a real store and a faked repository",
  vars: {
    request: "Write tests for the MealPlanner service.",
  },
  assert: [
    {
      type: "javascript",
      metric: "spec-next-to-service",
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
      /* MealRepository is edited to extract MealRepositoryDef. */
      value: filesUntouched(
        ["src/app/meal-planner.ts", "src/app/meal-store.ts"],
        FIXTURE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "repository-faked",
      value: globExists("src/**/meal-repository.fake.ts"),
    },
    {
      type: "javascript",
      metric: "store-not-faked",
      value: globAbsent("src/**/meal-store.fake.ts"),
    },
    {
      type: "javascript",
      metric: "injected-through-testbed",
      value: fileContains(specPath, /TestBed\.inject\(MealPlanner\)/),
    },
    {
      type: "javascript",
      metric: "suite-named-after-sut",
      value: fileContains(specPath, /describe\(MealPlanner,/),
    },
    {
      type: "javascript",
      metric: "partial-match",
      value: fileContains(specPath, /objectContaining|toMatchObject/),
    },
    {
      type: "javascript",
      metric: "throws",
      value: fileContains(specPath, /\.toThrow\(/),
    },
    {
      type: "javascript",
      metric: "no-constructor",
      value: fileOmits(specPath, /\bnew MealPlanner\b/),
    },
    {
      type: "javascript",
      metric: "no-spy-on",
      value: fileOmits(specPath, /\bvi\.spyOn\(/),
    },
    {
      type: "javascript",
      metric: "no-module-mocks",
      value: fileOmits(specPath, /\bvi\.mock\(/),
    },
    {
      type: "javascript",
      metric: "no-use-value",
      value: fileOmits(specPath, /\buseValue\b/),
    },
    {
      type: "javascript",
      metric: "no-mock-return",
      value: fileOmits(specPath, /\bmockReturnValue\b/),
    },
    {
      type: "javascript",
      metric: "no-http-testing-controller",
      value: fileOmits(specPath, /\bHttpTestingController\b/),
    },
    {
      type: "javascript",
      metric: "no-before-each",
      value: fileOmits(specPath, /\bbeforeEach\(/),
    },
    {
      type: "javascript",
      metric: "no-try-catch",
      value: fileOmits(specPath, /\bcatch\s*\(/),
    },
    {
      type: "javascript",
      metric: "store-class-not-replaced",
      value: fileOmits(specPath, /MealStoreFake|provide:\s*MealStore/),
    },
    workspaceRubric(
      { spec: specPath, fake: "src/**/meal-repository.fake.ts" },
      "The output is the spec and the meal repository fake. An empty spec section fails.",
      {
        type: "llm-rubric",
        metric: "real-store-and-duplicate-rejection",
        value: `MealRepository is an in-memory fake class. A useValue method map fails. MealStore is the real class: the spec does not replace it.
One test adds a recipe and expects a literal name such as 'Burger' via objectContaining or toMatchObject.
One test rejects a duplicate with toThrow or rejects.toThrow, and the expected message is a literal.
Deriving the expected name from the arranged recipe fails. try/catch fails.`,
      },
    ),
  ],
};

export default testCase;
