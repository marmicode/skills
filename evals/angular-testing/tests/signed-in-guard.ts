import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import { expectElementCall, specPasses } from "../../shared/helpers.ts";

const SPEC_PATH = "src/app/is-signed-in.guard.browser.spec.ts";

export default defineTestCase({
  description: "tests a guard with the real router",
  vars: {
    request: "Write tests for isSignedInGuard.",
  },
  assert: [
    {
      type: "javascript",
      metric: "spec-next-to-guard",
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
        ["src/app/is-signed-in.guard.ts", "src/app/auth.ts"],
        FIXTURE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "real-router",
      value: fileContains(SPEC_PATH, /\bprovideRouter\(/),
    },
    {
      type: "javascript",
      metric: "harness",
      value: fileContains(SPEC_PATH, /\bRouterTestingHarness\b/),
    },
    {
      type: "javascript",
      metric: "soft-url",
      value: fileContains(SPEC_PATH, /\bexpect\.soft\(/),
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
      value: fileContains(SPEC_PATH, /describe\(isSignedInGuard,/),
    },
    {
      type: "javascript",
      metric: "no-activated-route",
      value: fileOmits(SPEC_PATH, /\bActivatedRoute\b/),
    },
    {
      type: "javascript",
      metric: "no-router-mock",
      value: fileOmits(SPEC_PATH, /provide:\s*Router\b/),
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
      type: "llm-rubric",
      metric: "allows-and-redirects",
      transform: workspaceAsOutput([{ title: "Spec", path: SPEC_PATH }]),
      value: `The output is the spec. An empty spec section fails. The spec uses the real router. One test signs the user in and shows they reach the guarded page: the URL and a heading.
One test leaves them signed out and shows a redirect to /search: the URL and a heading.
expect.soft is used for a URL so a heading failure is still reported.
Stubbing Router or ActivatedRoute fails.
Test names are one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
