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
});
