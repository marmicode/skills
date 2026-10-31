import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Assertion,
  AssertionValueFunction,
  AssertionValueFunctionContext,
  GradingResult,
  TransformFunction,
} from "promptfoo";
import { $ } from "zx";
import { EXPECT_ELEMENT_CALL, TRY_CATCH } from "./helpers.ts";

/**
 * Factories for assertions that read the test's copy of the fixture.
 * promptfoo exposes that copy as `context.metadata.workingDir` and deletes
 * it once the assertions finish.
 */
export function fileExists(filePath: string): AssertionValueFunction {
  return (_, context) => {
    const content = readWorkspaceFile(context, filePath);
    if (content === undefined) return _fail(`missing ${filePath}`);
    return {
      pass: true,
      score: 1,
      reason: filePath,
      /* `final` is the key promptfoo labels "Grader output" and renders in a <pre>. */
      metadata: { graderOutputs: { final: content } },
    };
  };
}

export function fileContains(
  filePath: string,
  pattern: RegExp,
): AssertionValueFunction {
  return (_, context) => {
    const content = readWorkspaceFile(context, filePath);
    if (content === undefined) return _fail(`missing ${filePath}`);
    return pattern.test(content)
      ? true
      : _fail(`${filePath} does not match ${pattern}`);
  };
}

export function fileOmits(
  filePath: string,
  pattern: RegExp,
): AssertionValueFunction {
  return (_, context) => {
    const content = readWorkspaceFile(context, filePath);
    if (content === undefined) return _fail(`missing ${filePath}`);
    return pattern.test(content)
      ? _fail(`${filePath} matches ${pattern}`)
      : true;
  };
}

export function filesUntouched(
  filePaths: readonly string[],
  originalDir: string,
): AssertionValueFunction {
  return (_, context) => {
    const changed = filePaths.flatMap((filePath) => {
      const actual = readWorkspaceFile(context, filePath);
      const expectedPath = join(originalDir, filePath);
      const expected = existsSync(expectedPath)
        ? readFileSync(expectedPath, "utf8")
        : undefined;
      const same =
        actual !== undefined && expected !== undefined && actual === expected;
      return same ? [] : [{ filePath, actual }];
    });
    if (changed.length === 0) return true;
    return _fail(
      `differs: ${changed.map((file) => file.filePath).join(", ")}`,
      changed
        .map(
          ({ filePath, actual }) => `# ${filePath}\n${actual ?? "(missing)"}`,
        )
        .join("\n\n"),
    );
  };
}

export function globExists(pattern: string): AssertionValueFunction {
  return (_, context) =>
    globSync(pattern, { cwd: workspaceDir(context) }).length > 0;
}

export function globAbsent(pattern: string): AssertionValueFunction {
  return (_, context) => {
    const matches = globSync(pattern, { cwd: workspaceDir(context) });
    return matches.length === 0
      ? true
      : _fail(`unexpected ${matches.join(", ")}`);
  };
}

export function workspaceDir(context: AssertionValueFunctionContext): string {
  return _workspaceDir(context.metadata);
}

/**
 * Assertion transform for `llm-rubric`. The rubric grades this string instead
 * of the agent's message. Each entry is a heading and a workspace path.
 * A `*` in the path makes it a glob.
 */
export function workspaceAsOutput(
  files: readonly { title: string; path: string }[],
): TransformFunction {
  return (_output, context) => {
    const dir = _workspaceDir(context.metadata);
    return files
      .map(({ title, path }) => {
        const matches = [...new Set(globSync(path, { cwd: dir }))].sort();
        const body =
          matches.length === 0
            ? "(none)"
            : matches
                .map(
                  (filePath) =>
                    `# ${filePath}\n${readFileSync(join(dir, filePath), "utf8")}`,
                )
                .join("\n\n");
        return `## ${title}\n${body}`;
      })
      .join("\n\n");
  };
}

/**
 * Paths relative to the test workspace. A `*` makes the path a glob,
 * for example every `*.fake.ts` file under `src`.
 */
export function workspaceFiles(
  context: AssertionValueFunctionContext,
  filePath: string,
): string[] {
  const dir = workspaceDir(context);
  if (filePath.includes("*")) {
    return globSync(filePath, { cwd: dir }).sort();
  }
  return existsSync(join(dir, filePath)) ? [filePath] : [];
}

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

export function specPasses(
  specPaths: string | readonly string[],
): AssertionValueFunction {
  const patterns = typeof specPaths === "string" ? [specPaths] : [...specPaths];
  return async (_, context) => {
    const paths = patterns.flatMap((pattern) =>
      pattern.includes("*") ? workspaceFiles(context, pattern) : [pattern],
    );
    if (paths.length === 0) {
      return {
        pass: false,
        score: 0,
        reason: `missing ${patterns.join(", ")}`,
      };
    }
    const result = await $({
      cwd: workspaceDir(context),
      quiet: true,
      nothrow: true,
    })`pnpm vitest run ${paths}`;
    if (result.ok) return true;
    return { pass: false, score: 0, reason: result.stdall };
  };
}

function readWorkspaceFile(
  context: AssertionValueFunctionContext,
  filePath: string,
): string | undefined {
  const paths = workspaceFiles(context, filePath);
  if (paths.length === 0) return undefined;
  const dir = workspaceDir(context);
  return paths.map((path) => readFileSync(join(dir, path), "utf8")).join("\n");
}

function _workspaceDir(metadata: object | undefined): string {
  if (
    metadata == null ||
    !("workingDir" in metadata) ||
    typeof metadata.workingDir !== "string"
  ) {
    throw new Error("missing metadata.workingDir");
  }
  return metadata.workingDir;
}

function _assertion(metric: string, value: AssertionValueFunction): Assertion {
  return { type: "javascript", metric, value };
}

function _fail(reason: string, final?: string): GradingResult {
  return {
    pass: false,
    score: 0,
    reason,
    /* `final` is the key promptfoo labels "Grader output" and renders in a <pre>. */
    ...(final === undefined ? {} : { metadata: { graderOutputs: { final } } }),
  };
}
