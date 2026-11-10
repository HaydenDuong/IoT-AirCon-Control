# Stage 2: Domain Logic with TDD (TEST-DRIVEN-DEVELOPMENT)

## TDD & Clean Architecture Explanation

Test-Driven-Development (TDD) is an approach to software development that emphasizes writing automated tests before writing the actual code. It follows 3-step process:

- `RED`: write a failing test.
- `GREEN`: write the code to make it pass.
- `REFACTOR`: refactor the code to improve the design while ensuring that all tests still pass.

Clean Architecture is an architectural pattern that aims to create software systems that are easy to understand, maintain, and extend. It emphasizes separation of:

- Concerns.
- Dependency inversion.
- The use of interfaces to decouple the application from external dependencies.

Combining TDD & Clean Architecture to create a robust & scalable software system. Here is how it can be achieved:

1. Identify the requirments: identify the requirements of the system - these requirements should be captured in the form of user stories / use cases.
2. Write a failing test: write a test that fails - this test should be based on the requirements & should be automated using testing framework.
3. Write the code to make it pass: write the minimum amount of code to make the test pass - this should be written following the principles of Clean Architecture, with a clear separation of concerns & using interfaces to decouple the application from external dependencies.
4. Refactor the code: After the test passes, refactor the code to improve the design while ensuring that all tests still pass - this refactoring should also follow principles of Clean Architecture, making sure that the code is easy to understand, maintain, & extend.
5. Repeat the process: Repeat this process for all the requirements until the application is complete.

### Why not implement everything immediately?

A small slice makes failures easier to understand.

If several heating, cooling, validation, persistence, & messaging rules are implemented together, a failure may have many possible causes.

Thus, implementing one behavior at a time keeps cause and effect visible.

## Goal

Implement the air-conditioner's mode-decision logic as small, independently testable domain behavior.

The first slice decides whether an air conditioner currently in `OFF` mode should request `HEAT`.

## Smallest Observable Behaviour

Given:

- current mode: `OFF`
- room temperature: `17°C`
- user-configured comfort range: `20-25°C`

Expected next mode:

- `HEAT`

The comfort range is test input, not a hard-coded application value.

## Proposed Boundary

The domain operation will conceptually be:

```ts
nextMode = decideNextMode(input);
```

## Actual steps taken

### Files & Folder Structure

#### Folder Structure

src/
└── aircon/
    └── domain/
        └── decide-next-mode.spec.ts

#### File: decide-next-mode.spec.ts

The project uses `.spec.ts` for TS test files.

```test
decide-next-mode.ts         → production implementation
decide-nest-mode.spec.ts    → executable specification / test
```

`spec` means **specificaiton**. The test describes the behaviour that the production code must satisfy.

It is a naming convention, not special TS syntax. Vitest discovers these files because `vitest.config.ts` contains:

```ts
include: ['**/*.spec.ts'],
```

The E2E configuration uses a separate pattern:

```ts
include: ['**/*.e2e-spec.ts'],
```

Therefore:

```text
src/aircon/domain/decide-next-mode.spec.ts      → unit / domain test
test/app.e2e-spec.ts                            → end-to-end test
```

Some projects use `.test.ts` instead of `.spec.ts`. Neither is inherently better; follow the repository's existing convention consistently.

#### Checking the failing test, RED

run: npm test -- src/aircon/domain/decide-next-mode.spec.ts

```powershell
PS C:\Users\Hayden Duong\Desktop\learning_projects\iot_aircon_control> npm test -- src/aircon/domain/decide-next-mode.spec.ts

> iot-aircon-control@0.0.1 test
> vitest run src/aircon/domain/decide-next-mode.spec.ts

 RUN  v4.1.11 C:/Users/Hayden Duong/Desktop/learning_projects/iot_aircon_control

 ❯ src/aircon/domain/decide-next-mode.spec.ts (0 test)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/aircon/domain/decide-next-mode.spec.ts [ src/aircon/domain/decide-next-mode.spec.ts ]
Error: Cannot find module './decide-next-mode.js' imported from C:/Users/Hayden Duong/Desktop/learning_projects/iot_aircon_control/src/aircon/domain/decide-next-mode.spec.ts
 ❯ src/aircon/domain/decide-next-mode.spec.ts:6:1
      4| // export function decideNextMode(...) {...}
      5| // Note: 'describe', 'it', & 'expect' are not imported - because the generated Vitest configuration enables them as globals.
      6| import { decideNextMode } from './decide-next-mode.js';
       | ^
      7|
      8| // This calls the Vitest function 'describe' with 2 arguments:

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed (1)
      Tests  no tests
   Start at  16:34:02
   Duration  902ms (transform 28ms, setup 0ms, import 0ms, tests 0ms, environment 0ms)
```

Explanation: this is expected because this is our TDD `RED` state, not a mistake.

#### Added in 'decide-next-mode.ts' (production implementation)

Added: src/aircon/domain/decide-next-model.ts

Adjusted: src/aircon/domain/decide-next-mode.spec.ts

Re-run: npm test -- src/aircon/domain/decide-next-mode.spec.ts

terminal output:

```powershell
PS C:\Users\Hayden Duong\Desktop\learning_projects\iot_aircon_control> npm test -- src/aircon/domain/decide-next-mode.spec.ts

> iot-aircon-control@0.0.1 test
> vitest run src/aircon/domain/decide-next-mode.spec.ts

 RUN  v4.1.11 C:/Users/Hayden Duong/Desktop/learning_projects/iot_aircon_control

 ❯ src/aircon/domain/decide-next-mode.spec.ts (1 test | 1 failed) 9ms
   ❯ decideNextMode (1)
     × requests HEAT when the unit is OFF and the room is below the heating entry threshold 7ms

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/aircon/domain/decide-next-mode.spec.ts > decideNextMode > requests HEAT when the unit is OFF and the room is below the heating entry threshold
AssertionError: expected 'OFF' to be 'HEAT' // Object.is equality

Expected: "HEAT"
Received: "OFF"

 ❯ src/aircon/domain/decide-next-mode.spec.ts:25:26
     23|
     24|         // Assert - Verifies the observable result
     25|         expect(nextMode).toBe('HEAT');
       |                          ^
     26|     });
     27| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  17:36:33
   Duration  915ms (transform 32ms, setup 0ms, import 48ms, tests 9ms, environment 0ms)
```

Explanation: This failure is expected, compared with the previous test

- Before: module could not load → 0 tests
- Now: function executed → assertion detected incorrect behaviour

#### Added in Heating Logic for function `decideNextMode` of `decide-next-mode.ts`

Adjusted: src/aircon/domain/decide-next-mode.ts

Re-run: npm test -- src/aircon/domain/decide-next-mode.spec.ts

Terminal Output:

```powershell
PS C:\Users\Hayden Duong\Desktop\learning_projects\iot_aircon_control> npm test -- src/aircon/domain/decide-next-mode.spec.ts

> iot-aircon-control@0.0.1 test
> vitest run src/aircon/domain/decide-next-mode.spec.ts


 RUN  v4.1.11 C:/Users/Hayden Duong/Desktop/learning_projects/iot_aircon_control

 ✓ src/aircon/domain/decide-next-mode.spec.ts (1 test) 3ms
   ✓ decideNextMode (1)
     ✓ requests HEAT when the unit is OFF and the room is below the heating entry threshold 2ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  17:56:09
   Duration  279ms (transform 29ms, setup 0ms, import 45ms, tests 3ms, environment 0ms)
```

Run:

npm run format

Terminal Output:

```powershell
PS C:\Users\Hayden Duong\Desktop\learning_projects\iot_aircon_control> npm run format                                        

> iot-aircon-control@0.0.1 format
> prettier --write "src/**/*.ts" "test/**/*.ts"

src/aircon/domain/decide-next-mode.spec.ts 84ms
src/aircon/domain/decide-next-mode.ts 11ms
src/app.controller.spec.ts 9ms
src/app.controller.ts 6ms
src/app.module.ts 3ms
src/app.service.ts 3ms
src/main.ts 4ms
test/app.e2e-spec.ts 8ms
```

`Explanation`: Inside `package.json`, it contains a script as following:

```json
"format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
```

Running: npm run format => causes npm to executes: prettier --write "src/**/*.ts" "test/**/*.ts"

Command Breakdown:

- prettier: runs the project's locally installed Prettier formatter.
- --write: modifies matching files directly.
- src/**/*.ts: selects TypeScript files inside src and its subdirectories.
- test/**/*.ts: selects TypeScript files inside test and its subdirectories.
- **: matches directories recursively.
- *.ts: matches files ending in .ts.
- The \" characters in package.json are escaped quotation marks required by JSON. The backslashes are not passed to Prettier.

Prettier standardises mechanical formatting such as:

- Indentation
- Spaces
- Line wrapping
- Commas
- Semicolons
- Quote style
- Import and object layout

`Important Limitation`
Formatting only controls code appearance. It does not prove that:

- The business logic is correct.
- TypeScript types are correct.
- Tests pass.
- The application builds.
- The code is free from lint problems.

npm test -- src/aircon/domain/decide-next-mode.spec.ts

#### Added another test to 'decide-next-mode.spec.ts'

```TypeScript
it('remains OFF when the room equals the heating entry threshold', () => {

    // Arrange
    const input: DecideNextModeInput = {
        currentMode: 'OFF',
        roomTemperatureC: 18,
        comfortRange: {
            lowerC: 20,
            upperC: 25,
        },
    };

    // Act
    const nextMode = decideNextMode(input);

    // Assert
    expect(nextMode).toBe('OFF');
```

`Purpose`: This is a heating-boundary test, because we implemented the following logic within 'decide-next-mode.ts':

```TypeScript
export function decideNextMode(input: DecideNextModeInput): AirconMode {
  const heatingEntryThresholdC = input.comfortRange.lowerC - 2;

  if (
    input.currentMode === 'OFF' &&
    input.roomTemperatureC < heatingEntryThresholdC
  ) {
    return 'HEAT';
  }

  return input.currentMode;
}
```

We specified that the aircon should not change the its mode, from OFF to HEAT if the room temperature is at the lowerC of comfortRange.

Thus, this test just to confirming that implemented logic.

#### Added other tests to 'decide-next-mode.spec.ts' + COOLING-logic for 'decide-next-mode.ts'
