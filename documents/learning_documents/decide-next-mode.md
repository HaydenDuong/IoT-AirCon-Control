# File Explanation

## File Structure

```ts
export type AirconMode = 'OFF' | 'HEAT' | 'COOL';

export interface ComfortRange {
  lowerC: number;
  upperC: number;
}

export interface DecideNextModeInput {
  currentMode: AirconMode;
  roomTemperatureC: number;
  comfortRange: ComfortRange;
}

export function decideNextMode(
  input: DecideNextModeInput,
): AirconMode {
  return input.currentMode;
}
```

## Details Explanation

`type AirconMode = ...` creates a union type. Only those 3 strings (`OFF`, `HEAT`, `COOL`) are permitted.

`interface` describes the required shape of an object.

`input: DecideNextModeInput` checks the parameter.

`: AirconMode` after the parentheses checks the return value.

`export` makes the declaration available to another modules.
