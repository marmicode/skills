import type { Assertion, AssertionValueFunction } from "promptfoo";
import { fileContains, fileExists, fileOmits } from "./assertions.ts";
import { EXPECT_ELEMENT_CALL, specPasses, TRY_CATCH } from "./helpers.ts";

/**
 * Shared checks for a browser component spec. The spec file exists, vitest
 * passes, and the spec skips `beforeEach`, `detectChanges`,
 * `componentInstance`, `vi.mock`, `mockReturnValue`, `HttpTestingController`,
 * `querySelector`, `try`/`catch`, `MockComponent`, and `setInput`. `expected`
 * opts into the suite name, `page.getBy`, and `expect.element`.
 */
export function componentTestAssertions({
  specPath,
  expected = {},
}: {
  specPath: string;
  expected?: {
    suiteName?: string;
    pageLocators?: true;
    expectElement?: true;
  };
}): Assertion[] {
  const { suiteName, pageLocators, expectElement } = expected;
  return [
    _assertion("spec-next-to-component", fileExists(specPath)),
    _assertion("spec-passes", specPasses(specPath)),
    ...(pageLocators
      ? [_assertion("locators", fileContains(specPath, /\bpage\.getBy/))]
      : []),
    ...(expectElement
      ? [
          _assertion(
            "expect-element",
            fileContains(specPath, EXPECT_ELEMENT_CALL),
          ),
        ]
      : []),
    ...(suiteName
      ? [
          _assertion(
            "suite-named-after-sut",
            fileContains(
              specPath,
              new RegExp(String.raw`describe\(${suiteName},`),
            ),
          ),
        ]
      : []),
    _assertion("no-before-each", fileOmits(specPath, /\bbeforeEach\(/)),
    _assertion("no-detect-changes", fileOmits(specPath, /\.detectChanges\(/)),
    _assertion(
      "no-component-instance",
      fileOmits(specPath, /\.componentInstance\b/),
    ),
    _assertion("no-module-mocks", fileOmits(specPath, /\bvi\.mock\(/)),
    _assertion(
      "no-http-testing-controller",
      fileOmits(specPath, /\bHttpTestingController\b/),
    ),
    _assertion(
      "no-query-selector",
      fileOmits(specPath, /\bquerySelector(All)?\(/),
    ),
    _assertion("no-try-catch", fileOmits(specPath, TRY_CATCH)),
    _assertion(
      "no-mock-return",
      fileOmits(specPath, /\bmockReturnValue\b|\bmockRejectedValue\b/),
    ),
    _assertion("no-mock-component", fileOmits(specPath, /\bMockComponent\b/)),
    _assertion("no-set-input", fileOmits(specPath, /\.setInput\(/)),
  ];
}

function _assertion(metric: string, value: AssertionValueFunction): Assertion {
  return { type: "javascript", metric, value };
}
