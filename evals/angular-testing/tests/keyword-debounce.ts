import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileOmits,
  filesUntouched,
  testFileAssertions,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import { OUTPUT_BINDING_CALL } from "../../shared/helpers.ts";

const TEST_PATH = "src/app/keyword-search.browser.spec.ts";
const TEST_PATTERN = "src/app/keyword-search*.spec.ts";

export default defineTestCase({
  description: "tests a debounce with fake timers",
  vars: {
    request:
      "Write tests for KeywordSearch. The debounce is the behavior under test: cover both before and after the delay.",
  },
  assert: [
    ...testFileAssertions({
      testPath: TEST_PATTERN,
      expected: { testPath: TEST_PATH, pageLocators: true },
    }),
    {
      type: "javascript",
      metric: "source-untouched",
      value: filesUntouched(
        ["src/app/keyword-search.ts"],
        ANGULAR_APP_BASE_DIR,
      ),
    },
    {
      type: "javascript",
      metric: "fake-timers",
      value: fileContains(TEST_PATTERN, /\bvi\.useFakeTimers\(/),
    },
    {
      type: "javascript",
      metric: "advance-async",
      value: fileContains(TEST_PATTERN, /\badvanceTimersByTimeAsync\(/),
    },
    {
      type: "javascript",
      metric: "restore-timers",
      value: fileContains(TEST_PATTERN, /\bonTestFinished\(/),
    },
    {
      type: "javascript",
      metric: "output-binding",
      value: fileContains(TEST_PATTERN, OUTPUT_BINDING_CALL),
    },
    {
      type: "javascript",
      metric: "not-called-yet",
      value: fileContains(TEST_PATTERN, /not\.toHaveBeenCalled\(/),
    },
    {
      type: "javascript",
      metric: "no-sync-advance",
      value: fileOmits(TEST_PATTERN, /\bvi\.advanceTimersByTime\(/),
    },
    {
      type: "javascript",
      metric: "no-sync-run-all",
      value: fileOmits(TEST_PATTERN, /\bvi\.runAllTimers\(/),
    },
    {
      type: "javascript",
      metric: "no-fake-async",
      value: fileOmits(TEST_PATTERN, /\bfakeAsync\b|\btick\(|\bwaitForAsync\b/),
    },
    {
      type: "javascript",
      metric: "no-sleep",
      value: fileOmits(TEST_PATTERN, /\bsetTimeout\(/),
    },
    {
      type: "llm-rubric",
      threshold: 0.9,
      metric: "manual-timers-around-the-debounce",
      transform: workspaceAsOutput([{ title: "Spec", path: TEST_PATTERN }]),
      value: `The output is the spec.
Fake timers are installed before the component is created.
One test advances to just before 300ms.
Another advances past 300ms and expects the spy to have been called with the literal keywords the user typed.
Neither test advances by exactly 300.`,
    },
  ],
});
