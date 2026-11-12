import type { AirconMode } from './decide-next-mode.js';

// Describe the function input
// Similar to C# input DTO
// An interface does not create an object - it only describes the required shape of an object.
export interface ModelModeTransitionInput {
  currentMode: AirconMode;
  nextMode: AirconMode;
  zoneId: string;
  sourceEventId: string;
  sourceObservedAt: string; // Validated ISO 8601 UTC timestamp from the source event.
  reason: string;
}

// Describe a history record
// This is created when the mode actually changes
export interface ModeTransition {
  previousMode: AirconMode;
  nextMode: AirconMode;
  zoneId: string;
  sourceEventId: string;
  sourceObservedAt: string;
  reason: string;
}

// This controls what TS permits the function to return
// This is a compile-time contract - it disappears from the generated JS
// It prevents invalid combination such as:
// 1. Invalid: claims a change without providing transition details
// {
//    changed: true,
//    currentMode: 'HEAT',
// }
// 2. Invalid: claims no change but provides transition history
// {
//    changed: false,
//    transition: {/*...*/},
// }
export type ModelModeTransitionResult =
  | {
      changed: true;
      transition: ModeTransition;
    }
  | {
      changed: false;
      currentMode: AirconMode;
    };

// This function connects `type ModelModeTransitionResult` & the `if (...)`
// Tells TS: every path through this function must return one of the 2 permitted result shapes.
export function modelModeTransition(
  input: ModelModeTransitionInput,
): ModelModeTransitionResult {
  const isDirectReversal =
    (input.currentMode === 'HEAT' && input.nextMode === 'COOL') ||
    (input.currentMode === 'COOL' && input.nextMode === 'HEAT');

  if (isDirectReversal) {
    throw new Error(
      `Direct ${input.currentMode}-to-${input.nextMode} transition is forbidden`,
    );
  }

  // This controls runtime behavior
  // This code exists in the generated JS and chooses which result to produce
  if (input.nextMode === input.currentMode) {
    return {
      changed: false,
      currentMode: input.currentMode,
    };
  }

  return {
    changed: true,
    transition: {
      previousMode: input.currentMode,
      nextMode: input.nextMode,
      zoneId: input.zoneId,
      sourceEventId: input.sourceEventId,
      sourceObservedAt: input.sourceObservedAt,
      reason: input.reason,
    },
  };
}
