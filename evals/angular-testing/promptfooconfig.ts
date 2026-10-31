import {
  defineClaudeCodeOptions,
  defineUnifiedConfig,
} from "../shared/config.ts";
import {
  ANGULAR_APP_WITH_SKILLS_DIR,
  ANGULAR_APP_NO_SKILLS_DIR,
} from "./fixtures/config.ts";
import componentWithRepository from "./tests/component-with-repository.ts";
import cookbookSearchError from "./tests/cookbook-search-error.ts";
import keywordDebounce from "./tests/keyword-debounce.ts";
import mealPlannerService from "./tests/meal-planner-service.ts";
import previewAndFilter from "./tests/preview-and-filter.ts";
import recipeOfTheDayShallow from "./tests/recipe-of-the-day-shallow.ts";
import seasonalExtractRepository from "./tests/seasonal-extract-repository.ts";
import signedInGuard from "./tests/signed-in-guard.ts";
import weeknightDinner from "./tests/weeknight-dinner.ts";

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
        working_dir: ANGULAR_APP_WITH_SKILLS_DIR,
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
        working_dir: ANGULAR_APP_NO_SKILLS_DIR,
      }),
    },
  ],
  extensions: ["file://../shared/hooks.ts:beforeAll"],
  /* Grades llm-rubric assertions with the same model as the agent.
     Sonnet 5.5 thinks by default, and promptfoo prepends that thinking to the
     grader text. Parsing then takes the first `{...}` in the thinking, which
     is not `{pass, score}`, and the rubric fails closed. */
  defaultTest: {
    options: {
      provider: {
        id: `anthropic:messages:${SONNET}`,
        config: { apiKeyRequired: isCI, showThinking: false },
      },
    },
  },
  tests: [
    componentWithRepository,
    mealPlannerService,
    previewAndFilter,
    keywordDebounce,
    signedInGuard,
    seasonalExtractRepository,
    weeknightDinner,
    recipeOfTheDayShallow,
    cookbookSearchError,
  ],
});

function _sharedOptions() {
  return defineClaudeCodeOptions({
    apiKeyRequired: isCI,
    append_allowed_tools: ["Write", "Edit", "Bash"],
    copy_working_dir: true,
    model: SONNET,
  });
}
