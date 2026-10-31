import type { AssertionValueFunction } from "promptfoo";
import { $ } from "zx";
import { workspaceDir, workspaceFiles } from "./assertions.ts";

/* `<T>`, including `=>` and one nested `<>`, then `(`. */
const TYPE_ARG = `(?:<(?:[^<>]|=>|<[^<>]*>)*>)?`;

function _callOf(name: string): RegExp {
  return new RegExp(String.raw`\b${name}\s*${TYPE_ARG}\s*\(`);
}

/* Skill examples write `outputBinding<T>(` and `vi.fn<(...) => void>()`. */
export const INPUT_BINDING_CALL = _callOf("inputBinding");
export const OUTPUT_BINDING_CALL = _callOf("outputBinding");
export const VI_FN_CALL = _callOf(String.raw`vi\.fn`);
export const EXPECT_ELEMENT_CALL = /\bexpect\s*\.\s*element\s*\(/;
/* `expect` then `.poll(`, including a line break and indent before `.poll`. */
export const EXPECT_POLL_CALL = /\bexpect\s*\.\s*poll\s*\(/;
/* `try {` or `catch (`, not `promise.catch(`. */
export const TRY_CATCH = /\btry\s*\{|(?<!\.)\bcatch\s*\(/;
/* toHaveBeenCalledWith, toHaveBeenLastCalledWith, toHaveBeenCalledExactlyOnceWith. */
export const CALLED_WITH = /toHaveBeen\w*Called\w*With/;

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
