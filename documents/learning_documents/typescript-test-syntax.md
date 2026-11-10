# TypeScript Test Syntax with Vitest

This note explains the syntax used in `decide-next-mode.spec.ts`. Its purpose is to keep general learning material outside production and test code, allowing those files to remain focused on application behaviour.

## The Three Layers

The test combines three related but different technologies:

| Layer | Responsibility | Examples |
| --- | --- | --- |
| JavaScript | Runtime language syntax and behaviour | `const`, objects, functions, imports |
| TypeScript | Static type checking before runtime | type inference, interfaces, union types |
| Vitest | Test registration, execution, and assertions | `describe`, `it`, `expect`, `toBe` |

Most syntax in a `.ts` test is ordinary JavaScript. TypeScript checks whether values are being used consistently, while Vitest supplies the testing functions.

## Example Test

```ts
import { decideNextMode } from './decide-next-mode.js';

describe('decideNextMode', () => {
  it('requests HEAT when OFF and below the heating entry threshold', () => {
    // Arrange
    const input = {
      currentMode: 'OFF',
      roomTemperatureC: 17,
      comfortRange: {
        lowerC: 20,
        upperC: 25,
      },
    };

    // Act
    const nextMode = decideNextMode(input);

    // Assert
    expect(nextMode).toBe('HEAT');
  });
});
```

## Imports and Exports

```ts
import { decideNextMode } from './decide-next-mode.js';
```

This is an ECMAScript module, or ESM, named import.

- `import` loads a value exported by another module.
- `{ decideNextMode }` requests the export with that exact name.
- `from` identifies the module containing the export.
- `./` means the module is relative to the current file.

The production module must provide a matching named export:

```ts
export function decideNextMode(/* parameters */) {
  // implementation
}
```

### Why a TypeScript File Is Imported with `.js`

The source module is named `decide-next-mode.ts`, but this project uses ESM with TypeScript's `NodeNext` module resolution. TypeScript emits JavaScript for Node.js to execute, so the runtime module is `decide-next-mode.js`.

Therefore, the source-level import refers to the runtime `.js` path:

```ts
import { decideNextMode } from './decide-next-mode.js';
```

This is project configuration behaviour, not a Vitest requirement.

## Test Suites and Test Cases

### `describe`

```ts
describe('decideNextMode', () => {
  // related tests
});
```

`describe` groups related test cases. It receives two arguments:

1. A readable suite name.
2. A callback containing the tests in that suite.

The comma separates the two arguments.

### `it`

```ts
it('requests HEAT when OFF and below the threshold', () => {
  // test steps
});
```

`it` registers one test case. It also receives a readable name and a callback. Vitest executes the callback when it runs the test.

A useful test name describes observable behaviour:

```text
condition or scenario → expected outcome
```

Avoid vague names such as `works`, `test 1`, or `handles input`.

### Why These Functions Are Not Imported

The project's Vitest configuration enables test functions as globals. Its TypeScript configuration also includes the Vitest global types. Therefore, the test can use the following names without importing them:

```ts
describe(...);
it(...);
expect(...);
```

Another valid project style explicitly imports them:

```ts
import { describe, expect, it } from 'vitest';
```

Neither style is universally superior. Follow the repository's configured convention consistently.

## Arrow Functions and Callbacks

```ts
() => {
  // function body
}
```

This is an arrow function. In this example:

- `()` is the parameter list.
- The empty parameter list means the function receives no arguments.
- `=>` separates the parameters from the function body.
- `{}` contains the statements executed when the function is called.

For these test callbacks, it is similar to writing:

```ts
function () {
  // function body
}
```

`describe` and `it` receive functions instead of immediately calculated results. This allows Vitest to control when the suite is registered and when each test is executed.

## `const` and Object Literals

```ts
const input = {
  currentMode: 'OFF',
  roomTemperatureC: 17,
  comfortRange: {
    lowerC: 20,
    upperC: 25,
  },
};
```

### `const`

`const` declares a variable that cannot be reassigned:

```ts
input = anotherInput; // Not allowed
```

It does not make the contained object immutable:

```ts
input.roomTemperatureC = 18; // Currently allowed
```

### Object Literals

The outer braces create an object. Each `name: value` pair defines a property, and commas separate the properties.

`comfortRange` contains a nested object:

```ts
comfortRange: {
  lowerC: 20,
  upperC: 25,
}
```

This structure keeps the two related comfort boundaries together.

## Type Inference

No explicit type appears beside `input`, but TypeScript still examines its properties and infers a type approximately like this:

```ts
{
  currentMode: string;
  roomTemperatureC: number;
  comfortRange: {
    lowerC: number;
    upperC: number;
  };
}
```

This is called type inference.

An important detail is that an object property's `'OFF'` value may be widened to `string`. Later, the domain can define an explicit mode type so arbitrary values such as `'BROKEN'` are rejected:

```ts
type AirconMode = 'OFF' | 'HEAT' | 'COOL';
```

The test input can then be checked against an explicit input type. Introduce this when defining the production function's contract rather than adding type syntax without understanding its purpose.

## Function Calls and Return Values

```ts
const nextMode = decideNextMode(input);
```

This statement:

1. Calls `decideNextMode`.
2. Passes `input` as its argument.
3. Receives the function's return value.
4. Stores that value in `nextMode`.

The mode-decision function should initially be a pure function:

```text
same input → same output
```

It does not need a database, network request, file, clock, or hidden global state. That makes the business rule fast and deterministic to test.

## Assertions and Matchers

```ts
expect(nextMode).toBe('HEAT');
```

This assertion has two parts:

- `expect(nextMode)` supplies the actual result.
- `.toBe('HEAT')` supplies the expected result and performs the comparison.

`toBe` uses identity comparison based on `Object.is`. It is suitable for primitive values such as strings, numbers, and booleans.

```ts
expect('HEAT').toBe('HEAT'); // Passes
expect('OFF').toBe('HEAT');  // Fails
```

For object contents, `toEqual` is normally more appropriate:

```ts
expect(result).toEqual({ mode: 'HEAT' });
```

Do not memorise every matcher immediately. Choose a matcher that clearly expresses the behaviour being verified.

## Arrange, Act, Assert

The test follows the Arrange-Act-Assert structure:

```ts
// Arrange: create the scenario and inputs
const input = { /* ... */ };

// Act: execute the behaviour once
const nextMode = decideNextMode(input);

// Assert: verify the observable result
expect(nextMode).toBe('HEAT');
```

This structure makes the test easy to scan:

- **Arrange:** What situation exists?
- **Act:** What behaviour is executed?
- **Assert:** What result must be observable?

A test should normally focus on one behaviour or concept.

## How Vitest Executes the File

The simplified execution flow is:

```text
Vitest discovers a matching *.spec.ts file
                  ↓
Vitest loads the file and resolves its imports
                  ↓
describe registers the test suite
                  ↓
it registers the individual test case
                  ↓
Vitest executes the test callback
                  ↓
Arrange → Act → Assert
                  ↓
The assertion passes or throws a test failure
```

## Why a Missing Module Produced `0 test`

The first TDD run reported:

```text
Cannot find module './decide-next-mode.js'
Tests  no tests
```

This happened before the test callback ran:

```text
load spec → resolve import → import fails → test registration never occurs
```

Therefore:

- The test file was discovered successfully.
- The production module did not exist yet.
- `describe` and `it` were never reached.
- No assertion was executed.

This is a structural RED state. After the module exists, a failing assertion provides a more informative behavioural RED state, for example:

```text
expected 'OFF' to be 'HEAT'
```

## Common Failure Categories

| Output | Likely meaning |
| --- | --- |
| `Cannot find module` | Import path is wrong or the module does not exist |
| `0 test` with a failed suite | Failure occurred while loading the test file |
| `expected X to be Y` | Test ran, but actual behaviour differed from expected behaviour |
| TypeScript type error | Values do not satisfy the declared compile-time contract |
| Test timeout | Asynchronous work did not finish within the allowed time |

Do not fix errors by guessing. Identify which boundary failed: discovery, import, compilation, execution, or assertion.

## Punctuation Cheat Sheet

| Syntax | Meaning in this test |
| --- | --- |
| `'text'` | String value |
| `()` | Function parameters or function-call arguments |
| `{}` | Function body, object literal, or named import depending on context |
| `[]` | Array literal or indexed access |
| `:` | Separates an object property name from its value; also introduces a type annotation in other contexts |
| `,` | Separates arguments, properties, or items |
| `.` | Accesses a property or method, such as `.toBe` |
| `=>` | Defines an arrow function |
| `;` | Terminates a statement |

The meaning of `{}` depends on its position:

```ts
import { decideNextMode } from './decide-next-mode.js'; // named imports
const input = { currentMode: 'OFF' };                   // object literal
() => { /* statements */ };                             // function body
```

## Comments in a Learning Project

Detailed syntax comments are useful while learning, but leaving every explanation inline eventually hides the business behaviour.

Use this rule:

- Put reusable language and framework lessons in learning documents.
- Keep inline comments that explain a surprising project-specific reason.
- Let clear names and tests explain ordinary behaviour.
- Remove temporary learning comments after the concept becomes familiar.

Useful durable comment:

```ts
// Use the runtime `.js` path because this ESM project uses NodeNext resolution.
import { decideNextMode } from './decide-next-mode.js';
```

Unnecessary long-term comment:

```ts
// Store the function's returned value in the nextMode variable.
const nextMode = decideNextMode(input);
```

The second comment merely translates readable code into English.

## Review Checklist for a New Unit Test

Before considering a test complete, check:

- Does the name describe the scenario and expected result?
- Is the input clear without tracing through unrelated helpers?
- Does the test execute one meaningful behaviour?
- Does it assert an observable result instead of implementation details?
- Is the test deterministic and independent of external services?
- Would a failure explain what business behaviour broke?
- Are comments explaining a non-obvious reason rather than restating syntax?

## Further Reading

- [TypeScript: Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [TypeScript: Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [Vitest: Test API](https://vitest.dev/api/)
- [Vitest: Expect](https://vitest.dev/api/expect.html)
