import type { Assertion, AssertionValueFunction } from "promptfoo";
import { fileContains, fileExists, fileOmits } from "./assertions.ts";
import { EXPECT_ELEMENT_CALL, specPasses } from "./helpers.ts";

/**
 * Shared checks for a browser component spec. The spec file exists, vitest
 * passes, and the spec skips `beforeEach`, `detectChanges`, and
 * `componentInstance`. `expected` opts into the suite name, `page.getBy`,
 * and `expect.element`.
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
  ];
}

function _assertion(metric: string, value: AssertionValueFunction): Assertion {
  return { type: "javascript", metric, value };
}
