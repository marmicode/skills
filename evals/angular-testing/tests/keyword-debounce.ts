import type { TestCase } from "promptfoo";
import {
  fileContains,
  fileExists,
  fileOmits,
  filesEqual as filesUntouched,
} from "../../shared/assertions.ts";
import { FIXTURE_DIR } from "../fixtures/config.ts";
import {
  outputBindingCall,
  specPasses,
  workspaceRubric,
} from "../../shared/helpers.ts";

const specPath = "src/app/keyword-search.browser.spec.ts";

const testCase: TestCase = {
  description: "tests a debounce with fake timers",
  vars: {
    request:
      "Write tests for KeywordSearch. The debounce is the behavior under test: cover both before and after the delay.",
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
      value: filesUntouched(["src/app/keyword-search.ts"], FIXTURE_DIR),
    },
    {
      type: "javascript",
      metric: "fake-timers",
      value: fileContains(specPath, /\bvi\.useFakeTimers\(/),
    },
    {
      type: "javascript",
      metric: "advance-async",
      value: fileContains(specPath, /\badvanceTimersByTimeAsync\(/),
    },
    {
      type: "javascript",
      metric: "restore-timers",
      value: fileContains(specPath, /\bonTestFinished\(/),
    },
    {
      type: "javascript",
      metric: "output-binding",
      value: fileContains(specPath, outputBindingCall),
    },
    {
      type: "javascript",
      metric: "not-called-yet",
      value: fileContains(specPath, /not\.toHaveBeenCalled\(/),
    },
    {
      type: "javascript",
      metric: "locators",
      value: fileContains(specPath, /\bpage\.getBy/),
    },
    {
      type: "javascript",
      metric: "no-sync-advance",
      value: fileOmits(specPath, /\bvi\.advanceTimersByTime\(/),
    },
    {
      type: "javascript",
      metric: "no-sync-run-all",
      value: fileOmits(specPath, /\bvi\.runAllTimers\(/),
    },
    {
      type: "javascript",
      metric: "no-fake-async",
      value: fileOmits(specPath, /\bfakeAsync\b|\btick\(|\bwaitForAsync\b/),
    },
    {
      type: "javascript",
      metric: "no-sleep",
      value: fileOmits(specPath, /\bsetTimeout\(/),
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
    workspaceRubric(
      { spec: specPath },
      "The output is the spec. An empty spec section fails.",
      {
        type: "llm-rubric",
        metric: "manual-timers-around-the-debounce",
        value: `Fake timers are installed before the component is created and restored with onTestFinished.
One test advances to just before 300ms and expects the output spy not to have been called.
Another advances past 300ms and expects the spy to have been called with the literal keywords the user typed.
Neither test advances by exactly 300. The user types through a page locator.
fakeAsync, tick, and sleeping for the delay fail.`,
      },
    ),
  ],
};

export default testCase;
