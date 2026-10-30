import type { TestCase } from "promptfoo";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
  globExists,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import { specPasses } from "./helpers.ts";

const specPath = "src/app/catalog-search.spec.ts";
const sections = workspaceAsOutput({
  spec: specPath,
  fake: "src/**/catalog-repository.fake.ts",
});

const testCase: TestCase = {
  description: "follows the jsdom setup instead of switching to browser mode",
  vars: {
    request: "Write tests for the CatalogSearch component.",
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
        [
          "src/app/catalog-search.ts",
          "src/app/catalog-repository.ts",
          "vitest.config.mts",
        ],
        FIXTURE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "repository-faked",
      value: globExists("src/**/catalog-repository.fake.ts"),
    },
    {
      type: "javascript",
      metric: "testing-library-dom",
      value: fileContains(specPath, /@testing-library\/dom/),
    },
    {
      type: "javascript",
      metric: "retrying-query",
      value: fileContains(specPath, /expect\.poll\(|\bfindBy/),
    },
    {
      type: "javascript",
      metric: "suite-named-after-sut",
      value: fileContains(specPath, /describe\(CatalogSearch,/),
    },
    {
      type: "javascript",
      metric: "no-browser-mode",
      value: fileOmits(specPath, /vitest\/browser/),
    },
    {
      type: "javascript",
      metric: "no-angular-testing-library",
      value: fileOmits(specPath, /@testing-library\/angular/),
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
      type: "llm-rubric",
      metric: "jsdom-spec-and-browser-suggestion",
      transform: (output, context) =>
        `## message\n${output}\n\n${sections(output, context)}`,
      value: `The message section is the agent's reply. The spec and fake sections are the files it wrote. An empty spec section fails.
The spec uses screen from @testing-library/dom and retries with expect.poll or findBy. It arranges an in-memory CatalogRepository fake before creating the component.
It asserts the recipe names rendered in headings and the empty copy "No recipes found". Expected names are literals such as 'Burger'.
Calling a method on CatalogSearch, or importing vitest/browser, fails.
Test names are one behavior in the present tense. "should ..." fails.
The message suggests Vitest Browser Mode as a better setup. It does not claim the vitest config was changed.`,
    },
  ],
};

export default testCase;
