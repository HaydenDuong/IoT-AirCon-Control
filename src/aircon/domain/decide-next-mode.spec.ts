// Use the runtime `.js` path because this ESM project uses NodeNext resolution.
import {
  decideNextMode,
  type DecideNextModeInput,
} from './decide-next-mode.js';

describe('decideNextMode', () => {
  it('requests HEAT when the unit is OFF and the room temperature is below the heating entry threshold', () => {
    // Arrange
    const input: DecideNextModeInput = {
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

  it('remains OFF when the room temperature equals the heating entry threshold', () => {
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
  });

  it('requests COOL when the unit is OFF and the room temperature is above the cooling entry threshold', () => {
    // Arrange
    const input: DecideNextModeInput = {
      currentMode: 'OFF',
      roomTemperatureC: 28,
      comfortRange: {
        lowerC: 20,
        upperC: 25,
      },
    };

    // Act
    const nextMode = decideNextMode(input);

    // Assert
    expect(nextMode).toBe('COOL');
  });

  it('remains OFF when the room temperature equals the cooling entry threshold', () => {
    // Arrange
    const input: DecideNextModeInput = {
      currentMode: 'OFF',
      roomTemperatureC: 27,
      comfortRange: {
        lowerC: 20,
        upperC: 25,
      },
    };

    // Act
    const nextMode = decideNextMode(input);

    // Assert
    expect(nextMode).toBe('OFF');
  });

  it('remains OFF when the room temperature is between the entry thresholds', () => {
    // Arrange
    const input: DecideNextModeInput = {
      currentMode: 'OFF',
      roomTemperatureC: 22,
      comfortRange: {
        lowerC: 20,
        upperC: 25,
      },
    };

    // Act
    const nextMode = decideNextMode(input);

    // Assert
    expect(nextMode).toBe('OFF');
  });

  it('request OFF when the unit is HEAT and the room temperature is within the comfort range', () => {
    const input: DecideNextModeInput = {
      currentMode: 'HEAT',
      roomTemperatureC: 23,
      comfortRange: {
        lowerC: 20,
        upperC: 25,
      },
    };

    const nextMode = decideNextMode(input);

    expect(nextMode).toBe('OFF');
  });

  it('request OFF when the unit is COOL and the room temperature is within the comfort range', () => {
    const input: DecideNextModeInput = {
      currentMode: 'COOL',
      roomTemperatureC: 23,
      comfortRange: {
        lowerC: 20,
        upperC: 25,
      },
    };

    const nextMode = decideNextMode(input);

    expect(nextMode).toBe('OFF');
  });

  it('remain unchanged when the unit is HEAT and the room temperature is not yet reaching the stop temperature', () => {
    const input: DecideNextModeInput = {
      currentMode: 'HEAT',
      roomTemperatureC: 22,
      comfortRange: {
        lowerC: 20,
        upperC: 25,
      },
    };

    const nextMode = decideNextMode(input);

    expect(nextMode).toBe('HEAT');
  });

  it('remain unchanged when the unit is COOL and the room temperature is not yet reaching the stop temperature', () => {
    const input: DecideNextModeInput = {
      currentMode: 'COOL',
      roomTemperatureC: 24,
      comfortRange: {
        lowerC: 20,
        upperC: 25,
      },
    };

    const nextMode = decideNextMode(input);

    expect(nextMode).toBe('COOL');
  });

  it('request OFF instead of COOL when the unit is HEAT and the room temperature is above the cooling threshold', () => {
    const input: DecideNextModeInput = {
      currentMode: 'HEAT',
      roomTemperatureC: 28,
      comfortRange: {
        lowerC: 20,
        upperC: 25,
      },
    };

    const nextMode = decideNextMode(input);

    expect(nextMode).toBe('OFF');
  });

  it('request OFF instead of HEAT when the unit is COOL and the room temperature is below the heating threshold', () => {
    const input: DecideNextModeInput = {
      currentMode: 'COOL',
      roomTemperatureC: 17,
      comfortRange: {
        lowerC: 20,
        upperC: 25,
      },
    };

    const nextMode = decideNextMode(input);

    expect(nextMode).toBe('OFF');
  });
});
