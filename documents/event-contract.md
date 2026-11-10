# Event Contract

## Assumptions

- Month one supports one temperature-controlled zone.
- Celsius is the only accepted temperature unit.
- The simulator generates the event ID before publishing.
- Retries reuse the same event ID.
- Separate genuine readings receive different event IDs, even if their temperatures are identical.
- External JSON is untrusted until validated.
- One authoritative simulated temperature sensor exists for the zone in month one.
- Comfort configuration and current mode are not sensor-event fields.

## 1. Candidate Event

```json
{
    "eventId": "event-00001",
    "sensorId": "bedroom-temperature-1",
    "zoneId": "bedroom",
    "observedAt": "2026-10-08T05:15:00.000Z",
    "roomTemperatureC": 17.2
}
```

Version 1 accepts only Celsius through `roomTemperatureC`. Supporting another unit would require a versioned contract change and conversion to Celsius at the ingestion boundary before invoking domain logic.

## 2. Field Definitions

| Field | Producer | Meaning | Important rule |
| --- | --- | --- | --- |
| `eventId` | Simulator | Identifies one logical temperature reading | Reused when the same reading is retried; every new reading receives a new `eventId` |
| `sensorId` | Simulator Configuration | Identity of the producing sensor | Stable across readings |
| `zoneId` | Simulator Configuration | Identifies the temperature-controlled zone measured by the sensor | `bedroom` in month one |
| `observedAt` | Simulator | Time at which the sensor measured the room temperature | Valid ISO 8601 UTC timestamp ending in `Z` |
| `roomTemperatureC` | Simulator | Room temperature measured by the sensor | Finite Celsius number |

## 3. Validation Rules

### 3.1 Structural Validation (Asks whether the message has the expected shape)

- The payload must parse as JSON.
- The top-level value must be an object, not an array or `null`.
- All five required fields must exist.
- IDs and `observedAt` must be strings.
- `roomTemperatureC` must be a number.
- Unknown fields are rejected in version 1 to catch misspelled or unsupported fields.

### 3.2 Semantic Validation (Asks whether structurally correct values make sense)

- Empty or whitespace-only IDs are not valid.
- `eventId`, `sensorId`, and `zoneId` must contain between 1 and 128 characters.
- IDs may contain letters, numbers, hyphens, underscores, periods, and colons.
- The `bedroom-temperature-1` sensor is authorised to report only for the `bedroom` zone in month one.
- `observedAt` must be a valid ISO 8601 UTC timestamp ending in `Z`.
- `roomTemperatureC` must be finite and between -50°C and 60°C inclusive.
- A valid timestamp may still be stale. Stale-event handling is defined separately in the ordering policy.

### 3.3 Invalid-Event Effect (What is the system allowed or forbidden to do after an incoming event fails validation)

When structural or semantic validation fails, processing must stop before mode-decision logic is invoked.

An invalid event must not:

- Change the current operating mode.
- Create a transition-history entry.
- Be recorded as successfully processed.

The system may record diagnostic information such as a rejection reason, structured log, or rejected-event metric.

The MQTT acknowledgement and dead-letter policy will be defined with the messaging boundary later.

> **Senior-Engineering Principle:** Invalid input must fail safely and leave domain state unchanged.

## 4. Duplicate and Ordering Policies

### 4.1 Duplicate-Event Policy

- The first valid occurrence of an `eventId` may be processed.
- The same `eventId` with the same payload is a duplicate and must not
  repeat its business effect.
- The same `eventId` with a different payload is a conflict and must be
  rejected.
- Different event IDs represent different readings, even when their
  temperatures are equal.
- "Same payload" means the same validated values for all five contract fields. JSON white space and property order do not affect duplicate classification.

### 4.2 Timestamp-Ordering Policy

- Ordering is evaluated per zone using `observedAt`, not message-arrival time.
- The first valid event for a zone may be accepted.
- A subsequent event must have an `observedAt` later than the zone's last
  accepted observation.
- An event with an older timestamp is stale.
- A different event with an equal timestamp is non-newer and is rejected as
  ambiguous.
- A stale or non-newer event must not invoke mode-decision logic, change the
  current mode, or create transition history.
- Every accepted event advances the zone's last accepted timestamp, even when
  the operating mode remains unchanged.

### 4.3 Processing Precedence

Events are evaluated in this order:

1. Parse JSON.
2. Perform structural validation.
3. Perform semantic validation.
4. Check whether the event ID is new, duplicated, or conflicting.
5. Check timestamp ordering.
6. Invoke mode-decision logic only for a valid, new, and newer event.

A rejected, duplicate, conflicting, stale, or non-newer event may produce
diagnostic logs or metrics, but must not produce a mode transition.

## 5. Business and Transition Invariants

- A zone has exactly one effective operating mode: `OFF`, `HEAT`, or `COOL`.
- `HEAT` and `COOL` must never be effective simultaneously.
- A direct `HEAT -> COOL` or `COOL -> HEAT` transition is forbidden. The unit must transition through `OFF` before the opposite active mode may begin on a later accepted event.
- One accepted event may create at most one effective mode transition.
- Invalid, duplicate, conflicting, stale, or non-newer events must not create a mode transition.
- If the calculated next mode equals the current mode, no transition-history entry is created.
- Every transition-history entry must record the source `eventId`, `zoneId`, previous mode, next mode, transition reason, and source `observedAt` value.
- The previous and next modes in a transition-history entry must differ.
- Transition history is append-only. Existing history entries are not updated to represent later events.
- When transition history exists, the zone's current mode must agree with the next mode of its latest successfully committed transition.
- An `eventId` may be associated with at most one transition-history entry.
- Every accepted event advances the zone's last accepted observation time, even when it does not change the operating mode.
- Event acceptance, the last accepted observation time, any current-mode update, and any transition-history insertion form one consistency boundary. They must eventually be committed atomically so that partial processing cannot leave these records in disagreement.

## 6. Contract Examples

| Category | Scenario | Classification | Expected effect |
| --- | --- | --- | --- |
| Valid event | The candidate event from Section 1 has a new `eventId` and an `observedAt` value later than the zone's last accepted observation | Accepted | Continue to mode-decision processing |
| Structurally invalid | `roomTemperatureC` is `"17.2"` instead of the number `17.2` | Rejected | Do not invoke mode-decision logic, change mode, or create transition history |
| Semantically invalid | `eventId` contains only whitespace | Rejected | Do not invoke mode-decision logic, change mode, or create transition history |
| Duplicate | The same `eventId` and the same five validated field values are received again | Duplicate | Do not repeat the previously produced business effect |
| Conflicting event ID | An existing `eventId` is reused with a different temperature or another changed contract field | Conflict | Reject the event and preserve current domain state |
| Stale event | A different `eventId` arrives with an `observedAt` value older than the zone's last accepted observation | Stale | Do not invoke mode-decision logic, change mode, or create transition history |
| Non-newer event | A different `eventId` has an `observedAt` value equal to the zone's last accepted observation | Ambiguous/non-newer | Reject the event without changing domain state |
| Accepted without transition | A valid, new, newer event reports 22°C while the current mode is `OFF`, and the calculated next mode remains `OFF` | Accepted with no mode change | Record the event as processed and advance the last accepted observation time; do not create transition history |
