import { join } from "node:path";

export const FIXTURES_DIR = import.meta.dirname;
export const FIXTURE_DIR = join(FIXTURES_DIR, "angular-app");
export const WITH_SKILLS_DIR = join(
  FIXTURES_DIR,
  "tmp",
  "angular-app-with-skills",
);
export const NO_SKILLS_DIR = join(FIXTURES_DIR, "tmp", "angular-app-no-skills");
