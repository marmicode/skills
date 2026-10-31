import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileOmits,
  filesUntouched,
  testFileAssertions,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";

const TEST_PATH = "src/app/is-signed-in.guard.browser.spec.ts";
const TEST_PATTERN = "src/app/is-signed-in.guard*.spec.ts";

export default defineTestCase({
  description: "tests a guard with the real router",
  vars: {
    request: "Write tests for isSignedInGuard.",
  },
  assert: [
    ...testFileAssertions({
      testPath: TEST_PATTERN,
      expected: {
        testPath: TEST_PATH,
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
      value: fileContains(TEST_PATTERN, /\bprovideRouter\(/),
    },
    {
      type: "javascript",
      metric: "harness",
      value: fileContains(TEST_PATTERN, /\bRouterTestingHarness\b/),
    },
    {
      type: "javascript",
      metric: "soft-url",
      value: fileContains(TEST_PATTERN, /\bexpect\.soft\(/),
    },
    {
      type: "javascript",
      metric: "no-activated-route",
      value: fileOmits(TEST_PATTERN, /\bActivatedRoute\b/),
    },
    {
      type: "javascript",
      metric: "no-router-mock",
      value: fileOmits(TEST_PATTERN, /provide:\s*Router\b/),
    },
    {
      type: "llm-rubric",
      threshold: 0.9,
      metric: "allows-and-redirects",
      transform: workspaceAsOutput([{ title: "Spec", path: TEST_PATTERN }]),
      value: `The output is the spec.
One test signs the user in and shows they reach the guarded page: the URL and a heading.
One test leaves them signed out and shows a redirect to /search: the URL and a heading.
Test names are one behavior in the present tense. "should ..." fails.`,
    },
  ],
});
