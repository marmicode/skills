import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileOmits,
  filesEqual as filesUntouched,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import { componentTestAssertions } from "../../shared/component-assertions.ts";

const SPEC_PATH = "src/app/is-signed-in.guard.browser.spec.ts";

export default defineTestCase({
  description: "tests a guard with the real router",
  vars: {
    request: "Write tests for isSignedInGuard.",
  },
  assert: [
    ...componentTestAssertions({
      specPath: SPEC_PATH,
      expected: {
        suiteName: "isSignedInGuard",
        pageLocators: true,
        expectElement: true,
      },
    }),
    {
      type: "javascript",
      metric: "source-untouched",
      value: filesUntouched(
        ["src/app/is-signed-in.guard.ts", "src/app/auth.ts"],
        ANGULAR_APP_BASE_DIR,
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
      metric: "no-activated-route",
      value: fileOmits(SPEC_PATH, /\bActivatedRoute\b/),
    },
    {
      type: "javascript",
      metric: "no-router-mock",
      value: fileOmits(SPEC_PATH, /provide:\s*Router\b/),
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
