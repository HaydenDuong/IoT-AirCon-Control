import {
  modelModeTransition,
  type ModelModeTransitionInput,
} from './model-mode-transition.js';

describe('modelModeTransition', () => {
  it('creates a transition from OFF to HEAT when the room temperature is below the heating entry threshold', () => {
    // Arrange
    const input: ModelModeTransitionInput = {
      currentMode: 'OFF',
      nextMode: 'HEAT',
      zoneId: 'bedroom',
      sourceEventId: 'event-100',
      sourceObservedAt: '2026-11-12T05:00:00.000Z',
      reason: 'BELOW_HEATING_ENTRY_THRESHOLD',
    };

    // Act
    const result = modelModeTransition(input);

    // Assert
    expect(result).toEqual({
      changed: true,
      transition: {
        previousMode: 'OFF',
        nextMode: 'HEAT',
        zoneId: 'bedroom',
        sourceEventId: 'event-100',
        sourceObservedAt: '2026-11-12T05:00:00.000Z',
        reason: 'BELOW_HEATING_ENTRY_THRESHOLD',
      },
    });
  });

  it('creates a transition from COOL to OFF when the room temperature reached the cooling stop target', () => {
    // Arrange
    const input: ModelModeTransitionInput = {
      currentMode: 'COOL',
      nextMode: 'OFF',
      zoneId: 'bedroom',
      sourceEventId: 'event-101',
      sourceObservedAt: '2026-11-12T05:05:00.000Z',
      reason: 'COOLING_STOP_TARGET_REACHED',
    };

    // Act
    const result = modelModeTransition(input);

    // Assert
    expect(result).toEqual({
      changed: true,
      transition: {
        previousMode: 'COOL',
        nextMode: 'OFF',
        zoneId: 'bedroom',
        sourceEventId: 'event-101',
        sourceObservedAt: '2026-11-12T05:05:00.000Z',
        reason: 'COOLING_STOP_TARGET_REACHED',
      },
    });
  });

  it('returns no change when the next mode equals the current mode', () => {
    // Arrange
    const input: ModelModeTransitionInput = {
      currentMode: 'HEAT',
      nextMode: 'HEAT',
      zoneId: 'bedroom',
      sourceEventId: 'event-102',
      sourceObservedAt: '2026-11-12T05:10:00.000Z',
      reason: 'HEATING_STOP_TARGET_NOT_REACHED',
    };

    // Act
    const result = modelModeTransition(input);

    // Assert
    expect(result).toEqual({
      changed: false,
      currentMode: 'HEAT',
    });
  });

  it('creates a transition from HEAT to OFF when reaching the heating stop target', () => {
    // Arrange
    const input: ModelModeTransitionInput = {
      currentMode: 'HEAT',
      nextMode: 'OFF',
      zoneId: 'bedroom',
      sourceEventId: 'event-103',
      sourceObservedAt: '2026-11-12T05:15:00.000Z',
      reason: 'HEATING_STOP_TARGET_REACHED',
    };

    // Act
    const result = modelModeTransition(input);

    // Assert
    expect(result).toEqual({
      changed: true,
      transition: {
        previousMode: 'HEAT',
        nextMode: 'OFF',
        zoneId: 'bedroom',
        sourceEventId: 'event-103',
        sourceObservedAt: '2026-11-12T05:15:00.000Z',
        reason: 'HEATING_STOP_TARGET_REACHED',
      },
    });
  });

  it('creates a transition from OFF to COOL when room temperature is above the cooling entry threshold', () => {
    // Arrange
    const input: ModelModeTransitionInput = {
      currentMode: 'OFF',
      nextMode: 'COOL',
      zoneId: 'bedroom',
      sourceEventId: 'event-104',
      sourceObservedAt: '2026-11-12T05:20:00.000Z',
      reason: 'ABOVE_COOLING_ENTRY_THRESHOLD',
    };

    // Act
    const result = modelModeTransition(input);

    // Assert
    expect(result).toEqual({
      changed: true,
      transition: {
        previousMode: 'OFF',
        nextMode: 'COOL',
        zoneId: 'bedroom',
        sourceEventId: 'event-104',
        sourceObservedAt: '2026-11-12T05:20:00.000Z',
        reason: 'ABOVE_COOLING_ENTRY_THRESHOLD',
      },
    });
  });

  it('rejects a direct transition from HEAT to COOL', () => {
    // Arrange
    const input: ModelModeTransitionInput = {
      currentMode: 'HEAT',
      nextMode: 'COOL',
      zoneId: 'bedroom',
      sourceEventId: 'event-105',
      sourceObservedAt: '2026-11-12T05:30:00.000Z',
      reason: 'ABOVE_COOLING_ENTRY_THRESHOLD',
    };

    // Assert
    expect(() => modelModeTransition(input)).toThrow(
      'Direct HEAT-to-COOL transition is forbidden',
    );
  });

  it('rejects a direct transition from COOL to HEAT', () => {
    // Arrange
    const input: ModelModeTransitionInput = {
      currentMode: 'COOL',
      nextMode: 'HEAT',
      zoneId: 'bedroom',
      sourceEventId: 'event-106',
      sourceObservedAt: '2026-11-12T05:35:00.000Z',
      reason: 'BELOW_HEATING_ENTRY_THRESHOLD',
    };

    // Assert
    expect(() => modelModeTransition(input)).toThrow(
      'Direct COOL-to-HEAT transition is forbidden',
    );
  });
});
