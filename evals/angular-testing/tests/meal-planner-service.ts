import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
  globAbsent,
  globExists,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import { specPasses } from "../../shared/helpers.ts";

const SPEC_PATH = "src/app/meal-planner.spec.ts";

export default defineTestCase({
  description: "tests a service with a real store and a faked repository",
  vars: {
    request: "Write tests for the MealPlanner service.",
  },
  assert: [
    {
      type: "javascript",
      metric: "spec-next-to-service",
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
      value: fileContains(SPEC_PATH, /TestBed\.inject\(MealPlanner\)/),
    },
    {
      type: "javascript",
      metric: "suite-named-after-sut",
      value: fileContains(SPEC_PATH, /describe\(MealPlanner,/),
    },
    {
      type: "javascript",
      metric: "partial-match",
      value: fileContains(SPEC_PATH, /objectContaining|toMatchObject/),
    },
    {
      type: "javascript",
      metric: "throws",
      value: fileContains(SPEC_PATH, /\.toThrow\(/),
    },
    {
      type: "javascript",
      metric: "no-constructor",
      value: fileOmits(SPEC_PATH, /\bnew MealPlanner\b/),
    },
    {
      type: "javascript",
      metric: "no-spy-on",
      value: fileOmits(SPEC_PATH, /\bvi\.spyOn\(/),
    },
    {
      type: "javascript",
      metric: "no-module-mocks",
      value: fileOmits(SPEC_PATH, /\bvi\.mock\(/),
    },
    {
      type: "javascript",
      metric: "no-use-value",
      value: fileOmits(SPEC_PATH, /\buseValue\b/),
    },
    {
      type: "javascript",
      metric: "no-mock-return",
      value: fileOmits(SPEC_PATH, /\bmockReturnValue\b/),
    },
    {
      type: "javascript",
      metric: "no-http-testing-controller",
      value: fileOmits(SPEC_PATH, /\bHttpTestingController\b/),
    },
    {
      type: "javascript",
      metric: "no-before-each",
      value: fileOmits(SPEC_PATH, /\bbeforeEach\(/),
    },
    {
      type: "javascript",
      metric: "no-try-catch",
      value: fileOmits(SPEC_PATH, /\bcatch\s*\(/),
    },
    {
      type: "javascript",
      metric: "store-class-not-replaced",
      value: fileOmits(SPEC_PATH, /MealStoreFake|provide:\s*MealStore/),
    },
    {
      type: "llm-rubric",
      metric: "real-store-and-duplicate-rejection",
      transform: workspaceAsOutput([
        { title: "Spec", path: SPEC_PATH },
        { title: "Fake", path: "src/**/meal-repository.fake.ts" },
      ]),
      value: `The output is the spec and the meal repository fake. An empty spec section fails. MealRepository is an in-memory fake class. A useValue method map fails. MealStore is the real class: the spec does not replace it.
One test adds a recipe and expects a literal name such as 'Burger' via objectContaining or toMatchObject.
One test rejects a duplicate with toThrow or rejects.toThrow, and the expected message is a literal.
Deriving the expected name from the arranged recipe fails. try/catch fails.`,
    },
  ],
});
