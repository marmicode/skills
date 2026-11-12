import type {
  AgentDefinition,
  CanUseTool,
  HookCallbackMatcher,
  HookEvent,
  OnElicitation,
  OutputFormat,
  SandboxSettings,
  SettingSource,
  Settings,
  SpawnedProcess,
  SpawnOptions,
  ThinkingConfig,
  ToolConfig,
} from "@anthropic-ai/claude-agent-sdk";

/**
 * Copied from promptfoo 0.125.1 `src/providers/claude-agent-sdk.ts`.
 * The package does not export this type, so provider configs cannot be
 * checked through `UnifiedConfig` alone.
 *
 * `MCPConfig` is the unexported alias of `McpConfig` in
 * `src/contracts/providerConfig/mcp.ts`.
 */
type MCPAuth =
  | { type: "" | "none" | "no_auth" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | {
      type: "api_key";
      value: string;
      api_key?: string;
      keyName?: string;
      placement?: "header" | "query";
    }
  | {
      type: "api_key";
      api_key: string;
      value?: string;
      keyName?: string;
      placement?: "header" | "query";
    }
  | {
      type: "oauth";
      grantType?: "client_credentials";
      clientId: string;
      clientSecret: string;
      tokenUrl?: string;
      scopes?: string | string[];
    }
  | {
      type: "oauth";
      grantType: "password";
      username: string;
      password: string;
      clientId?: string;
      clientSecret?: string;
      tokenUrl?: string;
      scopes?: string | string[];
    };

type MCPServerConfig = {
  args?: string[];
  name?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  auth?: MCPAuth;
  command?: string;
  path?: string;
  url?: string;
} & ({ command: string } | { path: string } | { url: string });

interface MCPConfig {
  enabled?: boolean;
  server?: MCPServerConfig;
  servers?: MCPServerConfig[];
  timeout?: number;
  resetTimeoutOnProgress?: boolean;
  maxTotalTimeout?: number;
  pingOnConnect?: boolean;
  tools?: string[];
  exclude_tools?: string[];
  debug?: boolean;
  verbose?: boolean;
  serverName?: string;
  defaultArgs?: Record<string, unknown>;
  transformResponse?: string;
  /** @deprecated Use transformResponse instead. */
  responseParser?: string;
}

export interface ClaudeCodeOptions {
  apiKey?: string;
  apiKeyRequired?: boolean;

  /**
   * 'working_dir' allows user to point to a pre-prepared directory with desired files/directories in place
   * If not supplied, we'll use an empty temp dir for isolation
   */
  working_dir?: string;

  /**
   * Run each eval call in a fresh copy of `working_dir`, created by promptfoo eval. `true` clones
   * a clean git repository and copies anything else; `'git'` or `'copy'` forces one method.
   */
  copy_working_dir?: boolean | "git" | "copy";

  /**
   * 'model' and 'fallback_model' are optional
   * if not supplied, Claude Agent SDK uses default models
   * 'fallback_model' accepts a comma-separated list, tried in order (SDK >= 0.3.160)
   */
  model?: string;
  fallback_model?: string;

  max_turns?: number;
  max_thinking_tokens?: number;

  /**
   * Enable the Claude subprocess's native model, tool, and subagent OpenTelemetry spans.
   * Existing OTEL environment settings take precedence over Promptfoo's local defaults.
   * @default false
   */
  deep_tracing?: boolean;

  mcp?: MCPConfig;
  strict_mcp_config?: boolean; // only allow MCP servers that are explicitly configured—no discovery; true by default

  /**
   * When true, enables caching even when MCP servers are configured.
   * Use this when your MCP tools are deterministic (e.g., code search, static knowledge bases).
   * Different MCP configurations will produce different cache keys.
   * @default false
   */
  cache_mcp?: boolean;

  /**
   * Permission mode for controlling how tool executions are handled:
   * - 'default' - Standard behavior, prompts for dangerous operations
   * - 'manual' - Alias for 'default', prompts for dangerous operations
   * - 'plan' - Planning mode, no actual tool execution
   * - 'acceptEdits' - Auto-accept file edit operations
   * - 'bypassPermissions' - Bypass all permission checks (requires allow_dangerously_skip_permissions)
   * - 'dontAsk' - Don't prompt for permissions, deny if not pre-approved
   * - 'auto' - Use a model classifier to approve or deny permission prompts
   */
  permission_mode?:
    | "default"
    | "manual"
    | "plan"
    | "acceptEdits"
    | "bypassPermissions"
    | "dontAsk"
    | "auto";

  /**
   * Custom workflow instructions for plan mode. Only takes effect when
   * `permission_mode` is `'plan'`; the string replaces the default
   * code-implementation workflow body in the plan-mode system reminder.
   * The CLI still wraps it with the read-only enforcement preamble and the
   * ExitPlanMode protocol footer.
   */
  plan_mode_instructions?: string;

  /**
   * User can set a custom system prompt, or append to the default Claude Agent SDK system prompt
   */
  custom_system_prompt?: string;
  append_system_prompt?: string;

  /**
   * When `true`, strip per-user dynamic sections (working directory, auto-memory,
   * git status) from the Claude Code preset system prompt so the prompt-caching
   * prefix stays static and eligible for cross-user cache hits. The stripped
   * context is re-injected as the first user message so the model still has
   * access to it. Has no effect when `custom_system_prompt` is set.
   *
   * Useful for large eval fleets where many runs share the same system prompt
   * and the per-user dynamic context would otherwise bust the cache.
   *
   * @see https://platform.claude.com/docs/en/agent-sdk/settings
   */
  exclude_dynamic_sections?: boolean;

  /**
   * Since we run CC by default with a readonly set of allowed_tools, user can either fully replace the list ('custom_allowed_tools'), append to it ('append_allowed_tools'), or allow all tools ('allow_all_tools')
   */
  custom_allowed_tools?: string[];
  append_allowed_tools?: string[];
  allow_all_tools?: boolean;

  /**
   * 'disallowed_tools' is passed through as is; it always takes precedence over 'allowed_tools'
   */
  disallowed_tools?: string[];

  /**
   * 'setting_sources' controls where the Claude Agent SDK looks for settings, CLAUDE.md, and slash commands—accepts 'user', 'project', and 'local'
   * if not supplied, it won't look for any settings, CLAUDE.md, or slash commands
   */
  setting_sources?: SettingSource[];

  /**
   * 'plugins' allows loading Claude Code plugins from local file system paths
   * Each plugin must be a directory containing .claude-plugin/plugin.json manifest
   */
  plugins?: Array<{ type: "local"; path: string }>;

  /**
   * Filters which Skills are loaded into the main session.
   *
   * - omitted: no SDK-side filtering — the CLI's own defaults still apply
   *   (this is **not** "skills off")
   * - `'all'`: enable every discovered skill
   * - `string[]`: enable only the listed skills, matched by SKILL.md `name` /
   *   directory name, or `plugin:skill` for plugin-qualified skills
   *
   * When set, the SDK auto-allows the `Skill` tool for the session — you do
   * not need to add it to `append_allowed_tools` / `custom_allowed_tools`.
   *
   * This is a context filter, not a sandbox: unlisted skills are hidden from
   * the model's listing and rejected by the Skill tool, but their files
   * remain on disk and are reachable via Read/Bash. Do not store secrets in
   * skill files.
   *
   * Skills are discovered from the directories enabled by `setting_sources`
   * and from `plugins`; this option only narrows the set, it does not
   * discover new skills.
   *
   * @example
   * ```yaml
   * skills: all
   * skills:
   *   - pdf
   *   - docx
   * ```
   *
   * @see https://platform.claude.com/docs/en/agent-sdk/skills
   */
  skills?: string[] | "all";

  /**
   * Maximum budget in USD for this session. When exceeded, the SDK will stop with error_max_budget_usd.
   * Useful for cost control in automated evaluations.
   */
  max_budget_usd?: number;

  /**
   * Additional directories the agent can access beyond the working directory.
   * Useful when the agent needs to read files from multiple locations.
   */
  additional_directories?: string[];

  /**
   * Session ID to resume a previous conversation. The agent will continue from where it left off.
   * Use with 'fork_session' to branch instead of continuing the same session.
   */
  resume?: string;

  /**
   * When true and 'resume' is set, creates a new session branching from the resumed point
   * instead of continuing the original session.
   */
  fork_session?: boolean;

  /**
   * When resuming, only restore messages up to this message UUID.
   * Allows resuming from a specific point in the conversation history.
   */
  resume_session_at?: string;

  /**
   * When true, continues from the previous conversation without requiring a resume session ID.
   */
  continue?: boolean;

  /**
   * Programmatic agent definitions. Allows defining custom subagents inline without filesystem dependencies.
   * Keys are agent names, values are agent definitions with description, tools, and prompt.
   */
  agents?: Record<string, AgentDefinition>;

  /**
   * Maximum nesting depth for subagents. Defaults to five to preserve the
   * behavior of Claude Agent SDK versions before 0.3.217.
   */
  max_subagent_spawn_depth?: number;

  /**
   * Maximum number of subagents that can run concurrently. When omitted, the
   * Claude Agent SDK applies its own default (20 as of version 0.3.217).
   */
  max_concurrent_subagents?: number;

  /**
   * Output format specification for structured outputs.
   * When set, the agent will return validated JSON matching the provided schema.
   */
  output_format?: OutputFormat;

  /**
   * Hooks for intercepting events during agent execution.
   * Allows custom logic at various points like PreToolUse, PostToolUse, etc.
   */
  hooks?: Partial<Record<HookEvent, HookCallbackMatcher[]>>;

  /**
   * When true, includes partial/streaming messages in the response.
   * Useful for debugging or when you need to see intermediate outputs.
   */
  include_partial_messages?: boolean;

  /**
   * When true, forwards subagent text and thinking blocks as assistant/user
   * messages with `parent_tool_use_id` set. By default the SDK only emits
   * tool_use/tool_result blocks from subagents (enough for a heartbeat
   * counter). Enable this if you want a complete subagent transcript in
   * `metadata.toolCalls` / OTel spans.
   *
   * @default false
   */
  forward_subagent_text?: boolean;

  /**
   * When true, includes hook lifecycle events (hook_started, hook_progress, hook_response)
   * in the output stream. SessionStart and Setup hook events are always emitted regardless.
   *
   * @default false
   */
  include_hook_events?: boolean;

  /**
   * Per-tool configuration for built-in tools.
   *
   * @example
   * ```yaml
   * tool_config:
   *   askUserQuestion:
   *     previewFormat: html
   * ```
   */
  tool_config?: ToolConfig;

  /**
   * Enable AI-predicted next prompts. When true, the agent emits a prompt_suggestion
   * message after each turn with a predicted next user prompt.
   * Suggestions piggyback on the parent's prompt cache, making them nearly free.
   *
   * @default false
   */
  prompt_suggestions?: boolean;

  /**
   * Enable periodic AI-generated progress summaries for running subagents.
   * When true, subagent conversations are forked every ~30s to produce a short
   * present-tense description, emitted on task_progress events.
   *
   * @default false
   */
  agent_progress_summaries?: boolean;

  /**
   * Additional settings to apply. Accepts either a path to a settings JSON file
   * or a Settings object. These are loaded into the "flag settings" layer,
   * which has the highest priority among user-controlled settings.
   *
   * @example Path to settings file
   * ```yaml
   * settings: /path/to/settings.json
   * ```
   *
   * @example Inline settings object
   * ```yaml
   * settings:
   *   permissions:
   *     allow:
   *       - 'Bash(*)'
   * ```
   */
  settings?: string | Settings;

  /**
   * Policy-tier settings supplied by the embedding parent. Loaded into the
   * managed-settings layer (above HKCU, below IT-controlled sources), so
   * user/project settings cannot widen restrictions set here. Use this when
   * promptfoo runs inside an app that derives lockdown configuration from
   * its own enterprise policy and needs to enforce it on the SDK subprocess
   * without writing root-owned files.
   *
   * Differs from `settings` (flag layer, user-controllable) — prefer
   * `managed_settings` for fields like `sandbox.network.allowManagedDomainsOnly`.
   *
   * @example
   * ```yaml
   * managed_settings:
   *   sandbox:
   *     network:
   *       allowManagedDomainsOnly: true
   * ```
   */
  managed_settings?: Settings;

  /**
   * Callback for handling MCP elicitation requests.
   * Called when an MCP server requests user input (form fields, URL auth, etc.)
   * and no hook handles the request first. If not provided, elicitation requests
   * that aren't handled by hooks will be declined automatically.
   *
   * Note: This option is only available when using the provider programmatically,
   * not via YAML config.
   */
  on_elicitation?: OnElicitation;

  /**
   * Callback forwarded to Claude Agent SDK's `canUseTool` option.
   * Available only in programmatic configs because functions cannot be
   * represented in YAML.
   */
  can_use_tool?: CanUseTool;

  /**
   * Enable beta features. Currently supports:
   * - 'context-1m-2025-08-07' - Enable 1M token context window (Sonnet 4/4.5 only)
   *
   * @see https://platform.claude.com/docs/en/api/beta-headers
   */
  betas?: "context-1m-2025-08-07"[];

  /**
   * Controls Claude's thinking/reasoning behavior. When set, takes precedence over max_thinking_tokens.
   * - { type: 'adaptive' } - Claude decides when and how much to think (Opus 4.6+, default for supporting models)
   * - { type: 'enabled', budgetTokens?: number } - Fixed thinking token budget (older models)
   * - { type: 'disabled' } - No extended thinking
   *
   * @see https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost
   */
  thinking?: ThinkingConfig;

  /**
   * Token budget for the task. The model will pace its tool use to stay within this budget.
   * Useful for cost-conscious evaluations.
   *
   * @example
   * ```yaml
   * task_budget:
   *   total: 50000
   * ```
   */
  task_budget?: {
    total: number;
  };

  /**
   * Controls how much effort Claude puts into its response.
   * Works with adaptive thinking to guide thinking depth.
   * - 'low' - Minimal thinking, fastest responses
   * - 'medium' - Moderate thinking
   * - 'high' - Deep reasoning (default)
   * - 'xhigh' - Extra high reasoning (Opus 4.7+); sits between 'high' and 'max'
   * - 'max' - Maximum effort
   *
   * @see https://platform.claude.com/docs/en/build-with-claude/effort
   */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";

  /**
   * Agent name for the main thread. When specified, the agent's system prompt,
   * tool restrictions, and model will be applied to the main conversation.
   * The agent must be defined either in the 'agents' option or in settings.
   */
  agent?: string;

  /**
   * Use a specific session ID for the conversation instead of an auto-generated one.
   * Must be a valid UUID. Cannot be used with 'continue' or 'resume' unless
   * 'fork_session' is also set.
   */
  session_id?: string;

  /**
   * Custom title for a new session. When set, the session uses this title instead
   * of auto-generating one from the first user message. Useful for locating an
   * eval run in `~/.claude/projects/` or in Claude Code's session list.
   *
   * When resuming via `resume`/`continue`, the persisted title takes precedence.
   */
  title?: string;

  /**
   * Enable debug mode for the Claude Code process.
   * When true, enables verbose debug logging (equivalent to --debug CLI flag).
   */
  debug?: boolean;

  /**
   * Write debug logs to a specific file path.
   * Implicitly enables debug mode.
   */
  debug_file?: string;

  /**
   * Sandbox settings for command execution isolation.
   * When enabled, commands are executed in a sandboxed environment that restricts
   * filesystem and network access. This provides an additional security layer.
   *
   * Available options:
   * - `enabled` - Enable/disable sandboxing
   * - `autoAllowBashIfSandboxed` - Auto-allow bash commands when sandboxed
   * - `allowUnsandboxedCommands` - Allow commands that can't be sandboxed
   * - `enableWeakerNestedSandbox` - Enable weaker sandbox for nested environments
   * - `excludedCommands` - Commands to exclude from sandboxing
   * - `failIfUnavailable` - Fail closed when sandbox dependencies or platform support are missing
   * - `ignoreViolations` - Map of command patterns to violation types to ignore
   * - `network` - Network configuration:
   *   - `allowedDomains` - Domains the sandbox can access
   *   - `allowLocalBinding` - Allow binding to localhost
   *   - `allowUnixSockets` - Specific Unix sockets to allow
   *   - `allowAllUnixSockets` - Allow all Unix socket connections
   *   - `httpProxyPort` - HTTP proxy port for network access
   *   - `socksProxyPort` - SOCKS proxy port for network access
   * - `credentials` - Credential protection configuration:
   *   - `envVars` - Environment variables to deny or mask, with optional `injectHosts`
   *   - `allowPlaintextInject` - Allow masked credentials over plain HTTP (unsafe)
   * - `ripgrep` - Custom ripgrep configuration:
   *   - `command` - Path to ripgrep executable
   *   - `args` - Additional arguments for ripgrep
   *
   * @example Enable sandboxing with auto-allow
   * ```yaml
   * sandbox:
   *   enabled: true
   *   autoAllowBashIfSandboxed: true
   * ```
   *
   * @example Configure network options with proxy
   * ```yaml
   * sandbox:
   *   enabled: true
   *   network:
   *     allowLocalBinding: true
   *     allowedDomains:
   *       - api.example.com
   *     httpProxyPort: 8080
   *     socksProxyPort: 1080
   * ```
   *
   * @example Exclude specific commands and configure ripgrep
   * ```yaml
   * sandbox:
   *   enabled: true
   *   excludedCommands:
   *     - docker
   *     - podman
   *   ripgrep:
   *     command: /usr/local/bin/rg
   *     args: ['--hidden']
   * ```
   *
   * @see https://code.claude.com/docs/en/settings#sandbox-settings
   */
  sandbox?: SandboxSettings;

  /**
   * Must be set to true when using permission_mode: 'bypassPermissions'.
   * This is a safety measure to ensure intentional bypassing of permissions.
   */
  allow_dangerously_skip_permissions?: boolean;

  /**
   * MCP tool name to use for permission prompts. When set, permission requests
   * will be routed through this MCP tool instead of the default handler.
   */
  permission_prompt_tool_name?: string;

  /**
   * Callback for stderr output from the Claude Code process.
   * Useful for debugging and logging.
   *
   * Note: This option is only available when using the provider programmatically,
   * not via YAML config.
   */
  stderr?: (data: string) => void;

  /**
   * Environment variables to pass to the Claude Agent SDK subprocess.
   * Merged with process.env and EnvOverrides (precedence: EnvOverrides > config.env > process.env).
   *
   * Useful for forwarding OTEL settings so the SDK exports telemetry to a collector.
   *
   * @example
   * ```yaml
   * config:
   *   env:
   *     CLAUDE_CODE_ENABLE_TELEMETRY: "1"
   *     OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318"
   *     OTEL_EXPORTER_OTLP_PROTOCOL: "http/protobuf"
   * ```
   */
  env?: Record<string, string>;

  /**
   * JavaScript runtime to use for executing Claude Code.
   * Auto-detected if not specified.
   */
  executable?: "bun" | "deno" | "node";

  /**
   * Additional arguments to pass to the JavaScript runtime executable.
   */
  executable_args?: string[];

  /**
   * Additional CLI arguments to pass to Claude Code.
   * Keys are argument names (without --), values are argument values.
   * Use null for boolean flags.
   *
   * @example
   * ```yaml
   * extra_args:
   *   verbose: null  # Adds --verbose flag
   *   timeout: "30"  # Adds --timeout 30
   * ```
   */
  extra_args?: Record<string, string | null>;

  /**
   * Path to the Claude Code executable. Uses the built-in executable if not specified.
   * Useful for testing with custom builds or specific versions.
   */
  path_to_claude_code_executable?: string;

  /**
   * Specify the base set of available built-in tools.
   * - `string[]` - Array of specific tool names (e.g., `['Bash', 'Read', 'Edit']`)
   * - `[]` (empty array) - Disable all built-in tools
   * - `{ type: 'preset', preset: 'claude_code' }` - Use all default Claude Code tools
   *
   * This is different from 'custom_allowed_tools' - 'tools' specifies the base set,
   * while 'allowedTools' filters from that base.
   *
   * @example Use all default tools
   * ```yaml
   * tools:
   *   type: preset
   *   preset: claude_code
   * ```
   *
   * @example Use only specific tools
   * ```yaml
   * tools:
   *   - Bash
   *   - Read
   *   - Edit
   * ```
   */
  tools?: string[] | { type: "preset"; preset: "claude_code" };

  /**
   * Enable file checkpointing to track file changes during the session.
   * When enabled, files can be rewound to their state at any user message
   * using the Query.rewindFiles() method.
   *
   * File checkpointing creates backups of files before they are modified,
   * allowing restoration to previous states.
   *
   * @default false
   */
  enable_file_checkpointing?: boolean;

  /**
   * When false, disables session persistence to disk. Sessions will not be
   * saved to ~/.claude/projects/ and cannot be resumed later. Useful for
   * ephemeral or automated workflows where session history is not needed.
   *
   * @default true
   */
  persist_session?: boolean;

  /**
   * Custom function to spawn the Claude Code process.
   * Use this to run Claude Code in VMs, containers, or remote environments.
   *
   * When provided, this function is called instead of the default local spawn.
   *
   * Note: This option is only available when using the provider programmatically,
   * not via YAML config.
   *
   * @example
   * ```typescript
   * spawn_claude_code_process: (options) => {
   *   // Custom spawn logic for VM execution
   *   // options contains: command, args, cwd, env, signal
   *   return myVMProcess; // Must satisfy SpawnedProcess interface
   * }
   * ```
   */
  spawn_claude_code_process?: (options: SpawnOptions) => SpawnedProcess;

  /**
   * Configuration for handling AskUserQuestion tool in automated evaluations.
   * Since there's no human to answer questions, this provides automated responses.
   *
   * @example
   * ```yaml
   * ask_user_question:
   *   behavior: first_option  # Always select the first option
   * ```
   */
  ask_user_question?: {
    /**
     * Default behavior for answering questions:
     * - 'first_option': Always select the first option (default)
     * - 'random': Randomly select from available options
     * - 'deny': Deny the tool use (agent cannot ask questions)
     */
    behavior?: "first_option" | "random" | "deny";
  };
}

export function defineClaudeCodeOptions(
  options: ClaudeCodeOptions,
): ClaudeCodeOptions {
  return options;
}
