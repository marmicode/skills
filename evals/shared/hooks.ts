import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { BeforeAllExtensionHookContext } from "promptfoo";
import { $ } from "zx";
import {
  ANGULAR_APP_BASE_DIR,
  ANGULAR_APP_WITH_SKILLS_DIR,
  ANGULAR_APP_NO_SKILLS_DIR,
} from "../angular-testing/fixtures/config.ts";

const REPO_ROOT = resolve(import.meta.dirname, "../..");
const SKILLS_DIR = join(REPO_ROOT, "skills");

/**
 * Clones `fixtures/angular-app` into `fixtures/tmp/angular-app-with-skills`
 * and `fixtures/tmp/angular-app-without-skills`, installs dependencies in
 * each, then copies the angular-testing skill into the with-skills clone.
 *
 * The two providers cannot share the fixture: `copy_working_dir` copies
 * whatever is already there, and a skill left on disk is readable even when
 * `skills` is empty. A symlink would be simpler, but `copy_working_dir`
 * rejects symlinks pointing outside of `working_dir`.
 */
export async function beforeAll(_context: BeforeAllExtensionHookContext) {
  await _cloneFixture(ANGULAR_APP_NO_SKILLS_DIR);
  await _cloneFixture(ANGULAR_APP_WITH_SKILLS_DIR);

  const target = join(
    ANGULAR_APP_WITH_SKILLS_DIR,
    ".claude/skills/angular-testing",
  );
  mkdirSync(dirname(target), { recursive: true });
  cpSync(join(SKILLS_DIR, "angular-testing"), target, { recursive: true });
}

async function _cloneFixture(workingDir: string) {
  mkdirSync(dirname(workingDir), { recursive: true });
  rmSync(workingDir, { recursive: true, force: true });
  cpSync(ANGULAR_APP_BASE_DIR, workingDir, {
    recursive: true,
    verbatimSymlinks: true,
    filter: (src) => src !== join(ANGULAR_APP_BASE_DIR, ".claude"),
  });
  await $({ cwd: workingDir })`pnpm install`;
}
