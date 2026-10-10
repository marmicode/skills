# Running Tests

Run only the spec you touched, through the project's own test target. Find it first: the `test` script in `package.json`, the `test` target in `angular.json` or `project.json`, or a Vitest config.

If the project has Wallaby, prefer it over any command below.

## Contents

1. [Vitest CLI](#vitest-cli)
2. [Angular CLI](#angular-cli)
3. [Nx](#nx)

## Vitest CLI

```sh
npx vitest run path/to/x.spec.ts
```

- The path is a filter: Vitest runs the test files whose path contains it. `vitest run` runs once, without watch mode.
- Vitest looks for its config in the root only, which is `--root` or the current working directory. It does **not** pick the config closest to the file. In a monorepo, run the command from the directory that holds the config, or pass `--root <dir>` or `--config <path>`.
- When the config declares several projects, add `--project <name>` _(e.g. `--project browser`)_.
- There is no `--include` or `--testFiles` flag.

## Angular CLI

```sh
ng test <project> --include path/to/x.spec.ts --no-watch
```

- `--include` takes glob patterns relative to the project source root. A file path includes that test file; a directory path includes every test file in it.
- `<project>` is the Angular project name. Vitest's `--project` flag does not apply here.
- `--filter <regex>` narrows down to matching suite and test names.

## Nx

Check the executor of the `test` target first: the option differs.

| Target                                       | Command                                              |
| -------------------------------------------- | ---------------------------------------------------- |
| `@nx/vitest:test` executor                   | `nx test <project> --testFiles=path/to/x.spec.ts`    |
| `@angular/build:unit-test` executor          | `nx test <project> --include path/to/x.spec.ts`      |
| Inferred target running the `vitest` command | `nx test <project> -- x.spec.ts` _(a Vitest filter)_ |

An inferred target runs Vitest from the project directory, so a workspace-relative path may not match. Use the file name or a path relative to the project.
