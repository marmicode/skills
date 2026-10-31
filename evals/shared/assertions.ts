import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  AssertionValueFunction,
  AssertionValueFunctionContext,
  GradingResult,
  TransformFunction,
} from "promptfoo";

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

export function filesEqual(
  filePaths: readonly string[],
  expectedDir: string,
): AssertionValueFunction {
  return (_, context) => {
    const changed = filePaths.flatMap((filePath) => {
      const actual = readWorkspaceFile(context, filePath);
      const expectedPath = join(expectedDir, filePath);
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

function _fail(reason: string, final?: string): GradingResult {
  return {
    pass: false,
    score: 0,
    reason,
    /* `final` is the key promptfoo labels "Grader output" and renders in a <pre>. */
    ...(final === undefined ? {} : { metadata: { graderOutputs: { final } } }),
  };
}
