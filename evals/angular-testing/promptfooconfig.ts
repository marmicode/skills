import {
  defineClaudeCodeOptions,
  defineUnifiedConfig,
} from "../shared/config.ts";
import { WITH_SKILLS_DIR, NO_SKILLS_DIR } from "./fixtures/config.ts";
import componentWithRepository from "./tests/component-with-repository.ts";

const isCI = !!process.env.CI;

const SONNET = "claude-sonnet-5-5";

export default defineUnifiedConfig({
  description: "angular-testing skill",
  /* Records a span per turn and tool call, shown in the result's Traces tab. */
  tracing: { enabled: true },
  prompts: ["{{request}}"],
  providers: [
    {
      id: "anthropic:claude-agent-sdk",
      label: `${SONNET}:with-skill`,
      config: defineClaudeCodeOptions({
        ..._sharedOptions(),
        /* Absolute: `beforeAll` clones the fixture here and copies the skill in. */
        working_dir: WITH_SKILLS_DIR,
        /* Discovers `.claude/skil ls/*` but ignores user-level skills and settings. */
        setting_sources: ["project"],
        skills: ["angular-testing"],
      }),
    },
    {
      id: "anthropic:claude-agent-sdk",
      label: `${SONNET}:baseline`,
      config: defineClaudeCodeOptions({
        ..._sharedOptions(),
        /* Absolute: `beforeAll` clones the fixture here, without the skill. */
        working_dir: NO_SKILLS_DIR,
      }),
    },
  ],
  extensions: ["file://../shared/hooks.ts:beforeAll"],
  /* Grades llm-rubric assertions with the same model as the agent. */
  defaultTest: {
    options: {
      provider: {
        id: `anthropic:messages:${SONNET}`,
        config: { apiKeyRequired: isCI },
      },
    },
  },
  tests: [componentWithRepository],
});

function _sharedOptions() {
  return defineClaudeCodeOptions({
    apiKeyRequired: isCI,
    append_allowed_tools: ["Write", "Edit", "Bash"],
    copy_working_dir: true,
    model: SONNET,
  });
}
