import { join } from "node:path";

const FIXTURES_DIR = import.meta.dirname;

/**
 * This is the base Angular app workspace.
 */
export const ANGULAR_APP_BASE_DIR = join(FIXTURES_DIR, "angular-app");

/**
 * This is the Angular app workspace with skills.
 */
export const ANGULAR_APP_WITH_SKILLS_DIR = join(
  FIXTURES_DIR,
  "tmp",
  "angular-app-with-skills",
);

/**
 * This is the Angular app workspace without skills.
 */
export const ANGULAR_APP_NO_SKILLS_DIR = join(
  FIXTURES_DIR,
  "tmp",
  "angular-app-no-skills",
);
