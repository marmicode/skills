import type { TestCase, UnifiedConfig } from "promptfoo";

export { defineClaudeCodeOptions } from "./claude-code-options.ts";

export function defineTestCase(testCase: TestCase): TestCase {
  return testCase;
}

export function defineUnifiedConfig(config: UnifiedConfig): UnifiedConfig {
  return config;
}
