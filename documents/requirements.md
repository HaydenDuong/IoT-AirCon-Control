# Requirements: Home Air-Conditioning Controller

## Problem Statement

A resident wants the indoor temperature of one room to remain reasonably close to a preferred comfort range without repeatedly selecting heating, cooling, or off mode manually. The first version will simulate this decision-making process from room-temperature readings. It will demonstrate predictable mode transitions and failure handling, but it will not claim to control physical air-conditioning equipment or guarantee that a room reaches the requested temperature.

## First-Version Objective

Given the current simulated operating mode, a valid room-temperature reading, and a configured comfort range, the system must choose one next mode: `HEAT`, `COOL`, or `OFF`.

The first version models one home and one temperature-controlled zone. It prioritises simple, explainable, and testable decisions over advanced comfort or energy optimisation.

## Assumptions and Configuration

- Temperatures are expressed in degrees Celsius.
- The resident's comfort range has a lower bound and an upper bound.
- The lower bound must be less than the upper bound.
- The heating-entry threshold is 2°C below the lower comfort bound.
- The cooling-entry threshold is 2°C above the upper comfort bound.
- The stop target is the midpoint of the comfort range, rounded to the nearest whole degree; a midpoint ending in `.5` is rounded upward.
- The example comfort range is 20–25°C. Its heating-entry threshold is 18°C, cooling-entry threshold is 27°C, and stop target is 23°C.

The exact configuration mechanism is an implementation decision to be made later. A user interface is not required.

## Functional Requirements

### FR-1: Select a mode while currently OFF

When the current mode is `OFF`:

- A valid reading below the heating-entry threshold must request `HEAT`.
- A valid reading above the cooling-entry threshold must request `COOL`.
- A valid reading at or between the two entry thresholds must retain `OFF`.

For the 20–25°C example, 18°C does not start heating and 27°C does not start cooling because the entry comparisons are exclusive.

### FR-2: Continue or stop heating

When the current mode is `HEAT`:

- A valid reading below the stop target must retain `HEAT`.
- A valid reading at or above the stop target must request `OFF`.

If external conditions prevent the room from reaching the stop target, the simulated controller may remain in `HEAT`. Detecting lack of progress is outside the first-version scope.

### FR-3: Continue or stop cooling

When the current mode is `COOL`:

- A valid reading above the stop target must retain `COOL`.
- A valid reading at or below the stop target must request `OFF`.

If external conditions prevent the room from reaching the stop target, the simulated controller may remain in `COOL`. Detecting lack of progress is outside the first-version scope.

### FR-4: Prevent direct reversal

`HEAT` and `COOL` must be mutually exclusive. A single event must never cause a direct `HEAT -> COOL` or `COOL -> HEAT` transition.

If a reading indicates the opposite extreme while heating or cooling, the next mode must be `OFF`. The opposite active mode may begin only after a later valid event is processed while the current mode is `OFF`.

### FR-5: Reject invalid input safely

An invalid event must not change the current mode or create a mode-transition history entry. The detailed event fields and validation rules will be defined in the event-contract task.

### FR-6: Process repeated delivery idempotently

Each logical reading must have an event identity. Reprocessing an event with the same event ID must not repeat its business effect or create another mode-transition history entry.

Two different event IDs containing the same temperature are separate readings and must not be treated as duplicates.

### FR-7: Record effective transitions

The system must record a transition-history entry only when the effective mode changes. Processing a reading that retains the current mode must not create another transition entry.

## Behaviour Examples

The following examples use the 20–25°C comfort range and its 23°C stop target.

| Current mode | Reading | Required next mode | Reason |
|---|---:|---|---|
| `OFF` | 17°C | `HEAT` | Below the 18°C heating-entry threshold |
| `OFF` | 18°C | `OFF` | Entry threshold is exclusive |
| `OFF` | 22°C | `OFF` | Between the entry thresholds |
| `OFF` | 27°C | `OFF` | Entry threshold is exclusive |
| `OFF` | 28°C | `COOL` | Above the 27°C cooling-entry threshold |
| `HEAT` | 20°C | `HEAT` | Stop target has not been reached |
| `HEAT` | 23°C | `OFF` | Stop target has been reached |
| `HEAT` | 28°C | `OFF` | Direct reversal is forbidden |
| `COOL` | 25°C | `COOL` | Stop target has not been reached |
| `COOL` | 23°C | `OFF` | Stop target has been reached |
| `COOL` | 17°C | `OFF` | Direct reversal is forbidden |

## Non-Functional Requirements

- **Determinism:** The same valid reading, current mode, and configuration must always produce the same next mode.
- **Idempotency:** Reprocessing one event ID must produce no repeated transition or transition-history entry.
- **Consistency:** At most one effective mode may exist for the simulated zone, and `HEAT` and `COOL` must never be active together.
- **Isolation:** Invalid events must not partially change persistent state.
- **Testability:** Mode-decision logic must be testable without starting a message broker, database, container, or cloud service.
- **Traceability:** Every recorded mode transition must retain the source event identity and the reason for the transition.
- **Scope bound:** The first version supports one simulated temperature-controlled zone. Any workload experiment must report event rate and environment limitations and must not be presented as evidence of building-scale performance.

## Non-Goals

The first version will not include:

- Physical air-conditioning equipment or claims of equipment safety.
- Manual override controls or a user interface.
- Occupancy detection or presence-aware behaviour.
- Time-of-day schedules.
- Live weather forecasts or outdoor-temperature input.
- Multiple rooms, zones, homes, or buildings.
- Detection or notification when heating or cooling makes no progress.
- Notifications after repeated invalid sensor events.
- Energy-use optimisation or claims of energy savings.
- Cloud deployment, independently deployed microservices, Kubernetes, or autoscaling.

## Success Criteria

The first version is correct when:

- All documented mode decisions and boundary examples are protected by automated tests.
- Invalid and duplicate events produce no mode transition.
- Opposite active modes cannot be selected in one event.
- Transition history contains one record per effective mode change and none for unchanged decisions.
- The developer can explain the difference between a requirement and an implementation choice.

## Deferred Decisions

The following decisions belong to later tasks:

- The complete event schema and semantic validation rules.
- Handling of stale or out-of-order readings.
- How comfort configuration is supplied to the application.
- Persistence technology and atomicity strategy.
- Messaging protocol, delivery level, and retry behaviour.
- Runtime, validation library, test framework, and project structure.
