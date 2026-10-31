import type { AssertionValueFunction } from "promptfoo";
import { $ } from "zx";
import { workspaceDir, workspaceFiles } from "./assertions.ts";

/* `<T>`, including `=>` and one nested `<>`, then `(`. */
const typeArg = String.raw`(?:<(?:[^<>]|=>|<[^<>]*>)*>)?`;

function _callOf(name: string): RegExp {
  return new RegExp(String.raw`\b${name}\s*${typeArg}\s*\(`);
}

/* Skill examples write `outputBinding<T>(` and `vi.fn<(...) => void>()`. */
export const inputBindingCall = _callOf("inputBinding");
export const outputBindingCall = _callOf("outputBinding");
export const viFnCall = _callOf(String.raw`vi\.fn`);
export const expectElementCall = /\bexpect\s*\.\s*element\s*\(/;
/* toHaveBeenCalledWith, toHaveBeenLastCalledWith, toHaveBeenCalledExactlyOnceWith. */
export const calledWith = /toHaveBeen\w*Called\w*With/;

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
