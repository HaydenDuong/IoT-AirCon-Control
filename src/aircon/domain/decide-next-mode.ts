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

export function decideNextMode(input: DecideNextModeInput): AirconMode {
  const heatingEntryThresholdC = input.comfortRange.lowerC - 2;
  const coolingEntryThresholdC = input.comfortRange.upperC + 2;
  const stopTargetC = Math.round(
    (input.comfortRange.lowerC + input.comfortRange.upperC) / 2,
  );

  if (
    input.currentMode === 'OFF' &&
    input.roomTemperatureC < heatingEntryThresholdC
  ) {
    return 'HEAT';
  }

  if (
    input.currentMode === 'OFF' &&
    input.roomTemperatureC > coolingEntryThresholdC
  ) {
    return 'COOL';
  }

  if (input.currentMode === 'HEAT' && input.roomTemperatureC >= stopTargetC) {
    return 'OFF';
  }

  if (input.currentMode === 'COOL' && input.roomTemperatureC <= stopTargetC) {
    return 'OFF';
  }

  return input.currentMode;
}
