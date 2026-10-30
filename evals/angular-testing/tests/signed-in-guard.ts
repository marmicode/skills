import type { TestCase } from "promptfoo";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import { specPasses, workspaceRubric } from "./helpers.ts";

const specPath = "src/app/is-signed-in.guard.browser.spec.ts";

const testCase: TestCase = {
  description: "tests a guard with the real router",
  vars: {
    request: "Write tests for isSignedInGuard.",
  },
  assert: [
    {
      type: "javascript",
      metric: "spec-next-to-guard",
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
        ["src/app/is-signed-in.guard.ts", "src/app/auth.ts"],
        FIXTURE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "real-router",
      value: fileContains(specPath, /\bprovideRouter\(/),
    },
    {
      type: "javascript",
      metric: "harness",
      value: fileContains(specPath, /\bRouterTestingHarness\b/),
    },
    {
      type: "javascript",
      metric: "soft-url",
      value: fileContains(specPath, /\bexpect\.soft\(/),
    },
    {
      type: "javascript",
      metric: "locators",
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
      value: fileContains(specPath, /describe\(isSignedInGuard,/),
    },
    {
      type: "javascript",
      metric: "no-activated-route",
      value: fileOmits(specPath, /\bActivatedRoute\b/),
    },
    {
      type: "javascript",
      metric: "no-router-mock",
      value: fileOmits(specPath, /provide:\s*Router\b/),
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
    workspaceRubric(
      { spec: specPath },
      "The output is the spec. An empty spec section fails.",
      {
        type: "llm-rubric",
        metric: "allows-and-redirects",
        value: `The spec uses the real router. One test signs the user in and shows they reach the guarded page: the URL and a heading.
One test leaves them signed out and shows a redirect to /search: the URL and a heading.
expect.soft is used for a URL so a heading failure is still reported.
Stubbing Router or ActivatedRoute fails.
Test names are one behavior in the present tense. "should ..." fails.`,
      },
    ),
  ],
};

export default testCase;
