import type { Assertion, AssertionValueFunction } from "promptfoo";
import { $ } from "zx";
import { workspaceAsOutput, workspaceDir } from "../../shared/assertions.ts";

export function specPasses(
  specPaths: string | readonly string[],
): AssertionValueFunction {
  const paths = typeof specPaths === "string" ? [specPaths] : [...specPaths];
  return async (_, context) => {
    const result = await $({
      cwd: workspaceDir(context),
      quiet: true,
      nothrow: true,
    })`pnpm vitest run ${paths}`;
    if (result.ok) return true;
    return { pass: false, score: 0, reason: result.stdall };
  };
}

/* llm-rubric grades the agent's message. Feed it the workspace files instead. */
export function workspaceRubric(
  sections: Readonly<Record<string, string>>,
  preamble: string,
  assertion: Assertion,
): Assertion {
  return {
    ...assertion,
    type: "llm-rubric",
    transform: workspaceAsOutput(sections),
    value: `${preamble} ${assertion.value}`,
  };
}
