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
    const absolutePath = join(workspaceDir(context), filePath);
    if (!existsSync(absolutePath)) return _fail(`missing ${filePath}`);
    const content = readFileSync(absolutePath, "utf8");
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
    const file = readOneWorkspaceFile(context, filePath);
    if (!file.ok) return file.result;
    return pattern.test(file.content)
      ? true
      : _fail(`${file.path} does not match ${pattern}`);
  };
}

export function fileOmits(
  filePath: string,
  pattern: RegExp,
): AssertionValueFunction {
  return (_, context) => {
    const file = readOneWorkspaceFile(context, filePath);
    if (!file.ok) return file.result;
    return pattern.test(file.content)
      ? _fail(`${file.path} matches ${pattern}`)
      : true;
  };
}

export function filesUntouched(
  filePaths: readonly string[],
  originalDir: string,
): AssertionValueFunction {
  return (_, context) => {
    const changed: { filePath: string; actual: string }[] = [];
    for (const filePath of filePaths) {
      const file = readOneWorkspaceFile(context, filePath);
      if (!file.ok) return file.result;
      const expectedPath = join(originalDir, file.path);
      const expected = existsSync(expectedPath)
        ? readFileSync(expectedPath, "utf8")
        : undefined;
      if (file.content !== expected) {
        changed.push({ filePath: file.path, actual: file.content });
      }
    }
    if (changed.length === 0) return true;
    return _fail(
      `differs: ${changed.map((file) => file.filePath).join(", ")}`,
      changed
        .map(({ filePath, actual }) => `# ${filePath}\n${actual}`)
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
        const matches = _matchWorkspaceFiles(dir, path);
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
 * Single-file assertions require exactly one match.
 */
export function workspaceFiles(
  context: AssertionValueFunctionContext,
  filePath: string,
): string[] {
  return _matchWorkspaceFiles(workspaceDir(context), filePath);
}

/**
 * Shared checks for a test file. `testPath` may be a glob such as
 * `src/app/weeknight-dinner*.spec.ts`; exactly one file must match.
 * Vitest passes, and the file skips `beforeEach`, `detectChanges`,
 * `componentInstance`, `vi.mock`, `vi.spyOn`, `useValue`, `mockReturnValue`,
 * `HttpTestingController`, `querySelector`, `try`/`catch`, `MockComponent`,
 * and `setInput`. `expected` opts into an exact `testPath` (the file exists
 * at that path), the suite name, `new` of that name, `page.getBy`, and
 * `expect.element`.
 */
export function testFileAssertions({
  testPath,
  expected = {},
}: {
  testPath: string;
  expected?: {
    testPath?: string;
    suiteName?: string;
    pageLocators?: true;
    expectElement?: true;
  };
}): Assertion[] {
  const {
    testPath: exactTestPath,
    suiteName,
    pageLocators,
    expectElement,
  } = expected;
  return [
    ...(exactTestPath
      ? [_assertion("spec-next-to-sut", fileExists(exactTestPath))]
      : []),
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
    const paths: string[] = [];
    for (const pattern of patterns) {
      const matches = workspaceFiles(context, pattern);
      if (matches.length !== 1) return _fail(_matchReason(pattern, matches));
      paths.push(matches[0]);
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

/**
 * The one workspace file at `filePath`. A `*` is a glob.
 * Zero matches, or more than one, fails the assertion.
 */
function readOneWorkspaceFile(
  context: AssertionValueFunctionContext,
  filePath: string,
):
  | { ok: true; path: string; content: string }
  | { ok: false; result: GradingResult } {
  const paths = workspaceFiles(context, filePath);
  if (paths.length !== 1) {
    return { ok: false, result: _fail(_matchReason(filePath, paths)) };
  }
  const path = paths[0];
  return {
    ok: true,
    path,
    content: readFileSync(join(workspaceDir(context), path), "utf8"),
  };
}

function _matchWorkspaceFiles(dir: string, filePath: string): string[] {
  if (!filePath.includes("*")) {
    return existsSync(join(dir, filePath)) ? [filePath] : [];
  }
  return [...new Set(globSync(filePath, { cwd: dir }))].sort();
}

function _matchReason(filePath: string, paths: readonly string[]): string {
  if (paths.length === 0) return `missing ${filePath}`;
  return `${filePath} matched ${paths.length} files: ${paths.join(", ")}`;
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
