# Project Commands

This note explains the development commands currently available in the `iot-aircon-control` repository. It is a living reference: update it when scripts are added, removed, or changed in `package.json`.

## How npm Scripts Work

The project defines commands under the `scripts` property in `package.json`:

```json
{
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "test": "vitest run"
  }
}
```

Run a named script with:

```powershell
npm run <script-name>
```

For example:

```powershell
npm run build
npm run format
```

`npm test` is a built-in shorthand for `npm run test`.

npm automatically makes executables installed in `node_modules` available to these scripts. Therefore, the project uses its locally installed versions of NestJS, Prettier, Oxlint, and Vitest rather than depending on unrelated global installations.

## Command Index

| Command | Underlying script | Purpose |
| --- | --- | --- |
| `npm run build` | `nest build` | Compile the NestJS application into `dist` |
| `npm run format` | `prettier --write ...` | Format TypeScript source and test files |
| `npm run start` | `nest start` | Build and start the application once |
| `npm run start:dev` | `nest start --watch` | Start in development mode and restart after source changes |
| `npm run start:debug` | `nest start --debug --watch` | Start in watch mode with the Node.js debugger enabled |
| `npm run start:prod` | `node dist/main` | Run the previously compiled application from `dist` |
| `npm run lint` | `oxlint --type-aware src/ test/` | Check source and test files for lint problems with type-aware rules |
| `npm test` | `vitest run` | Run the unit-test suite once and exit |
| `npm run test:watch` | `vitest` | Keep Vitest running and rerun relevant tests after changes |
| `npm run test:cov` | `vitest run --coverage` | Run tests and generate a coverage report |
| `npm run test:debug` | `vitest --inspect-brk --no-file-parallelism` | Run tests for an attached debugger, pausing before execution |
| `npm run test:e2e` | `vitest run --config ./vitest.config.e2e.ts` | Run the end-to-end tests with their separate configuration |

## `npm run format`

### Purpose

Formats the project's TypeScript source and test files consistently using Prettier.

### Script

The command is defined in `package.json`:

```json
"format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
```

Running:

```powershell
npm run format
```

causes npm to execute the equivalent of:

```powershell
prettier --write "src/**/*.ts" "test/**/*.ts"
```

### Command Breakdown

- `prettier` runs the project's locally installed Prettier formatter.
- `--write` modifies matching files directly.
- `src/**/*.ts` selects TypeScript files in `src` and its subdirectories.
- `test/**/*.ts` selects TypeScript files in `test` and its subdirectories.
- `**` matches directories recursively.
- `*.ts` matches filenames ending in `.ts`.

The `\"` characters in `package.json` are escaped quotation marks required inside a JSON string. npm passes the quotation marks, not the backslashes, to the command.

### Project Formatting Rules

The `.prettierrc` file currently contains:

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

This means Prettier prefers:

- Single quotes where the language permits them.
- Trailing commas in supported multi-line structures.

Prettier also standardises indentation, spaces, line wrapping, semicolons, and the layout of imports and objects.

Example:

```ts
// Before formatting
export function decideNextMode (
    input: DecideNextModeInput,
) : AirconMode {
```

```ts
// After formatting
export function decideNextMode(
  input: DecideNextModeInput,
): AirconMode {
```

### Understanding the Output

Example:

```text
src/aircon/domain/decide-next-mode.ts 11ms
```

This means Prettier processed that file in approximately 11 milliseconds. It is not an error and does not measure the application's runtime performance.

Prettier may list every matching file it examined, including files that needed little or no modification.

### Scope and Limitations

The current script only targets `.ts` files under `src` and `test`. It does not format Markdown, `package.json`, or files elsewhere in the repository.

Formatting controls code appearance. It does not prove that:

- The business logic is correct.
- TypeScript types are correct.
- Tests pass.
- The application builds.
- The code is free from lint problems.

Because `--write` edits files, review the resulting changes:

```powershell
git diff
```

If formatting changed executable code, rerun the relevant tests.

## Running Tests

### Run All Unit Tests Once

```powershell
npm test
```

This uses `vitest run`, so Vitest runs the tests once and exits.

### Run One Test File

```powershell
npm test -- src/aircon/domain/decide-next-mode.spec.ts
```

The `--` separates npm's arguments from arguments that should be forwarded to the underlying `vitest run` command.

Running one focused test file provides a short feedback loop while implementing a particular behaviour. Run the complete suite before considering the work finished.

### Watch Tests During Development

```powershell
npm run test:watch
```

Watch mode remains active and reruns relevant tests when files change. Stop it with `Ctrl+C`.

### Run End-to-End Tests

```powershell
npm run test:e2e
```

This uses `vitest.config.e2e.ts`, which is separate from the unit-test configuration. End-to-end tests exercise a larger application boundary and are normally slower than pure domain tests.

### Run Tests with Coverage

```powershell
npm run test:cov
```

Coverage reports which statements, branches, functions, and lines were exercised by the tests. A high percentage does not automatically mean the tests verify the correct behaviour; assertion quality and important boundary cases still matter.

## Build and Run Commands

### Compile the Application

```powershell
npm run build
```

This invokes the NestJS build process and writes compiled output to `dist`.

### Start for Development

```powershell
npm run start:dev
```

Watch mode restarts the application after relevant source changes. It is intended for local development.

### Start the Compiled Application

```powershell
npm run build
npm run start:prod
```

`start:prod` runs `dist/main`, so a current successful build must exist first.

## Linting

```powershell
npm run lint
```

Oxlint checks `src` and `test` using type-aware rules. A formatter and linter have different responsibilities:

| Tool | Primary responsibility |
| --- | --- |
| Prettier | Consistent code appearance |
| Oxlint | Suspicious constructs and code-quality rules |
| TypeScript/Nest build | Compile-time type correctness |
| Vitest | Behavioural correctness |

A file can be correctly formatted but still contain a type error, lint problem, or incorrect business rule.

## Suggested Development Workflow

During a small TDD slice:

1. Run the focused test and observe RED.
2. Make the smallest defensible implementation change.
3. Run the focused test and observe GREEN.
4. Refactor names or structure without changing behaviour.
5. Run `npm run format`.
6. Rerun the focused test because files changed.

Before committing a completed slice:

```powershell
npm run format
npm run lint
npm test
npm run build
git status --short
git diff
```

Run `npm run test:e2e` when the change affects, or could affect, the application/API boundary. Pure domain-logic changes should still be covered primarily by fast unit tests.

## Senior-Engineering Principle

Use each tool for the evidence it can provide:

- Formatting proves consistency of presentation.
- Linting detects selected suspicious patterns.
- Compilation proves that checked types and imports are valid.
- Tests provide evidence of specified behaviour.
- Git inspection confirms exactly what will be committed.

No single command proves that the entire application is correct.
