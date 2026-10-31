import { defineTestCase } from "../../shared/config.ts";
import {
  fileContains,
  fileOmits,
  filesEqual as filesUntouched,
  workspaceAsOutput,
} from "../../shared/assertions.ts";
import { ANGULAR_APP_BASE_DIR } from "../fixtures/config.ts";
import { OUTPUT_BINDING_CALL } from "../../shared/helpers.ts";
import { componentTestAssertions } from "../../shared/component-assertions.ts";

const SPEC_PATH = "src/app/keyword-search.browser.spec.ts";

export default defineTestCase({
  description: "tests a debounce with fake timers",
  vars: {
    request:
      "Write tests for KeywordSearch. The debounce is the behavior under test: cover both before and after the delay.",
  },
  assert: [
    ...componentTestAssertions({
      specPath: SPEC_PATH,
      expected: { pageLocators: true },
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
      value: fileContains(SPEC_PATH, /\bvi\.useFakeTimers\(/),
    },
    {
      type: "javascript",
      metric: "advance-async",
      value: fileContains(SPEC_PATH, /\badvanceTimersByTimeAsync\(/),
    },
    {
      type: "javascript",
      metric: "restore-timers",
      value: fileContains(SPEC_PATH, /\bonTestFinished\(/),
    },
    {
      type: "javascript",
      metric: "output-binding",
      value: fileContains(SPEC_PATH, OUTPUT_BINDING_CALL),
    },
    {
      type: "javascript",
      metric: "not-called-yet",
      value: fileContains(SPEC_PATH, /not\.toHaveBeenCalled\(/),
    },
    {
      type: "javascript",
      metric: "no-sync-advance",
      value: fileOmits(SPEC_PATH, /\bvi\.advanceTimersByTime\(/),
    },
    {
      type: "javascript",
      metric: "no-sync-run-all",
      value: fileOmits(SPEC_PATH, /\bvi\.runAllTimers\(/),
    },
    {
      type: "javascript",
      metric: "no-fake-async",
      value: fileOmits(SPEC_PATH, /\bfakeAsync\b|\btick\(|\bwaitForAsync\b/),
    },
    {
      type: "javascript",
      metric: "no-sleep",
      value: fileOmits(SPEC_PATH, /\bsetTimeout\(/),
    },
    {
      type: "llm-rubric",
      metric: "manual-timers-around-the-debounce",
      transform: workspaceAsOutput([{ title: "Spec", path: SPEC_PATH }]),
      value: `The output is the spec. An empty spec section fails. Fake timers are installed before the component is created and restored with onTestFinished.
One test advances to just before 300ms and expects the output spy not to have been called.
Another advances past 300ms and expects the spy to have been called with the literal keywords the user typed.
Neither test advances by exactly 300. The user types through a page locator.
fakeAsync, tick, and sleeping for the delay fail.`,
    },
  ],
});
