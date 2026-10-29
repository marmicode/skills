import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  AssertionValueFunction,
  AssertionValueFunctionContext,
  GradingResult,
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
    const changed = filePaths.filter((filePath) => {
      const actual = readWorkspaceFile(context, filePath);
      const expectedPath = join(expectedDir, filePath);
      if (actual === undefined || !existsSync(expectedPath)) return true;
      return actual !== readFileSync(expectedPath, "utf8");
    });
    return changed.length === 0
      ? true
      : _fail(`differs: ${changed.join(", ")}`);
  };
}

export function globExists(pattern: string): AssertionValueFunction {
  return (_, context) =>
    globSync(pattern, { cwd: workspaceDir(context) }).length > 0;
}

export function workspaceDir(context: AssertionValueFunctionContext): string {
  const workingDir = context.metadata?.workingDir;
  if (typeof workingDir !== "string") {
    throw new Error("missing metadata.workingDir");
  }
  return workingDir;
}

function readWorkspaceFile(
  context: AssertionValueFunctionContext,
  filePath: string,
): string | undefined {
  const fullPath = join(workspaceDir(context), filePath);
  if (!existsSync(fullPath)) return undefined;
  return readFileSync(fullPath, "utf8");
}

function _fail(reason: string): GradingResult {
  return { pass: false, score: 0, reason };
}
