import type { Assertion, AssertionValueFunction } from "promptfoo";
import { fileContains, fileExists, fileOmits } from "./assertions.ts";
import { EXPECT_ELEMENT_CALL, specPasses, TRY_CATCH } from "./helpers.ts";

/**
 * Shared checks for a test file. The file exists, vitest passes, and the
 * file skips `beforeEach`, `detectChanges`, `componentInstance`, `vi.mock`,
 * `vi.spyOn`, `useValue`, `mockReturnValue`, `HttpTestingController`,
 * `querySelector`, `try`/`catch`, `MockComponent`, and `setInput`. `expected`
 * opts into the suite name, `new` of that name, `page.getBy`, and
 * `expect.element`.
 */
export function testFileAssertions({
  testPath,
  expected = {},
}: {
  testPath: string;
  expected?: {
    suiteName?: string;
    pageLocators?: true;
    expectElement?: true;
  };
}): Assertion[] {
  const { suiteName, pageLocators, expectElement } = expected;
  return [
    _assertion("spec-next-to-sut", fileExists(testPath)),
    _assertion("spec-passes", specPasses(testPath)),
    ...(pageLocators
      ? [_assertion("locators", fileContains(testPath, /\bpage\.getBy/))]
      : []),
    ...(expectElement
      ? [
          _assertion(
            "expect-element",
            fileContains(testPath, EXPECT_ELEMENT_CALL),
          ),
        ]
      : []),
    ...(suiteName
      ? [
          _assertion(
            "suite-named-after-sut",
            fileContains(
              testPath,
              new RegExp(String.raw`describe\(${suiteName},`),
            ),
          ),
          _assertion(
            "no-constructor",
            fileOmits(testPath, new RegExp(String.raw`\bnew ${suiteName}\b`)),
          ),
        ]
      : []),
    _assertion("no-before-each", fileOmits(testPath, /\bbeforeEach\(/)),
    _assertion("no-detect-changes", fileOmits(testPath, /\.detectChanges\(/)),
    _assertion(
      "no-component-instance",
      fileOmits(testPath, /\.componentInstance\b/),
    ),
    _assertion("no-module-mocks", fileOmits(testPath, /\bvi\.mock\(/)),
    _assertion("no-spy-on", fileOmits(testPath, /\bvi\.spyOn\(/)),
    _assertion("no-use-value", fileOmits(testPath, /\buseValue\b/)),
    _assertion(
      "no-http-testing-controller",
      fileOmits(testPath, /\bHttpTestingController\b/),
    ),
    _assertion(
      "no-query-selector",
      fileOmits(testPath, /\bquerySelector(All)?\(/),
    ),
    _assertion("no-try-catch", fileOmits(testPath, TRY_CATCH)),
    _assertion(
      "no-mock-return",
      fileOmits(testPath, /\bmockReturnValue\b|\bmockRejectedValue\b/),
    ),
    _assertion("no-mock-component", fileOmits(testPath, /\bMockComponent\b/)),
    _assertion("no-set-input", fileOmits(testPath, /\.setInput\(/)),
  ];
}

function _assertion(metric: string, value: AssertionValueFunction): Assertion {
  return { type: "javascript", metric, value };
}
