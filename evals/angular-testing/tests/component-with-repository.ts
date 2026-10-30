import { join } from "node:path";
import type { TestCase } from "promptfoo";
import { $ } from "zx";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
  globExists,
  workspaceDir,
} from "../../shared/assertions.ts";

const fixtureDir = join(import.meta.dirname, "../fixtures/angular-app");
const specPath = "src/app/recipe-search.spec.ts";

const testCase: TestCase = {
  description: "tests a component that loads data through a repository",
  vars: {
    request: "Write tests for the RecipeSearch component.",
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
      value: async (_, context) => {
        const result = await $({
          cwd: workspaceDir(context),
          quiet: true,
          nothrow: true,
        })`pnpm vitest run ${specPath}`;
        if (result.ok) return true;
        return { pass: false, score: 0, reason: result.stdall };
      },
    },
    {
      type: "javascript",
      metric: "source-untouched",
      value: filesUntouched(
        ["src/app/recipe-search.ts", "src/app/recipe-repository.ts"],
        fixtureDir,
      ),
    },
    {
      type: "javascript",
      metric: "repository-faked",
      value: globExists("src/**/*.fake.ts"),
    },
    {
      type: "javascript",
      metric: "browser-mode-locators",
      value: fileContains(specPath, /\bpage\.getBy/),
    },
    {
      type: "javascript",
      metric: "expect-element",
      value: fileContains(specPath, /\bexpect\.element\(/),
    },
    {
      type: "javascript",
      metric: "suite-named-after-sut",
      value: fileContains(specPath, /describe\(RecipeSearch,/),
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
    {
      type: "javascript",
      metric: "no-module-mocks",
      value: fileOmits(specPath, /\bvi\.mock\(/),
    },
    {
      type: "javascript",
      metric: "no-http-testing-controller",
      value: fileOmits(specPath, /\bHttpTestingController\b/),
    },
    {
      type: "javascript",
      metric: "no-query-selector",
      value: fileOmits(specPath, /\bquerySelector(All)?\(/),
    },
  ],
};

export default testCase;
