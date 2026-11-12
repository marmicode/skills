import angular from "@analogjs/vite-plugin-angular";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [angular({ tsconfig: "tsconfig.json" })],
  optimizeDeps: {
    /* Pre-bundle so the first run does not reload mid-test. */
    include: [
      "@angular/router",
      "@angular/router/testing",
      "@testing-library/dom",
    ],
  },
  test: {
    globals: true,
    setupFiles: ["src/test-setup.ts"],
    /* *.browser.spec.ts runs in Browser Mode. Every other spec runs in jsdom. */
    projects: [
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["src/**/*.spec.ts"],
          exclude: ["src/**/*.browser.spec.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["src/**/*.browser.spec.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
            /* Evals run unattended: don't open browser windows. */
            headless: true,
          },
        },
      },
    ],
  },
});
