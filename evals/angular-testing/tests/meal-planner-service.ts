import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileOmits,
  filesUntouched,
  globAbsent,
  globExists,
  testFileAssertions,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";

const SPEC_PATH = "src/app/meal-planner.spec.ts";

export default defineTestCase({
  description: "tests a service with a real store and a faked repository",
  vars: {
    request: "Write tests for the MealPlanner service.",
  },
  assert: [
    ...testFileAssertions({
      testPath: SPEC_PATH,
      expected: { suiteName: "MealPlanner" },
    }),
    {
      type: "javascript",
      metric: "source-untouched",
      /* MealRepository is edited to extract MealRepositoryDef. */
      value: filesUntouched(
        ["src/app/meal-planner.ts", "src/app/meal-store.ts"],
        ANGULAR_APP_BASE_DIR,
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
      metric: "store-class-not-replaced",
      value: fileOmits(SPEC_PATH, /MealStoreFake|provide:\s*MealStore/),
    },
    {
      type: "llm-rubric",
      threshold: 0.9,
      metric: "real-store-and-duplicate-rejection",
      transform: workspaceAsOutput([
        { title: "Spec", path: SPEC_PATH },
        { title: "Fake", path: "src/**/meal-repository.fake.ts" },
      ]),
      value: `The output is the spec and the meal repository fake.
MealRepository is an in-memory fake class.
One test adds a recipe and expects a literal name such as 'Burger'.
One test rejects a duplicate, and the expected message is a literal.
Deriving the expected name from the arranged recipe fails.`,
    },
  ],
});
