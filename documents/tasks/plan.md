# Implementation Plan: Home Air-Conditioning Controller

## Purpose

This is a four-week, learning-first home air-conditioning project, informed by lessons from the earlier university IoT lighting submissions. The objective is not to reproduce their architecture or to control real HVAC hardware. The objective is to build one small, correct within stated assumptions, measurable simulated system that the developer can explain and defend without assistance.

The developer remains the primary implementer. The mentor provides requirements, questions, hints, review, and explanations, but does not take over implementation.

## One-Month Outcome

At the end of four weeks, the repository should demonstrate this complete flow:

```text
Home temperature sensor simulator
    -> MQTT broker
    -> validated room-temperature event
    -> heating/cooling/off decision
    -> idempotent mode transition
    -> persisted mode and transition history
```

The result should be locally reproducible, tested, documented, and measured. It models one home and one temperature-controlled zone. It may support a narrow and honest resume entry, but it does not claim to operate real equipment or prove building-scale performance.

## Time Budget

- Duration: 4 weeks
- Working days: 5 per week
- Daily time: 4-5 focused hours
- Total budget: approximately 80-100 hours
- Work-in-progress limit: one task at a time

Suggested daily rhythm:

1. 20 minutes: review yesterday's notes and state today's observable outcome.
2. 30-45 minutes: study the relevant concept or official documentation.
3. 90-120 minutes: implement one small behaviour.
4. 45-60 minutes: test, debug, and investigate one failure case.
5. 30 minutes: review the diff and simplify unclear code.
6. 15-20 minutes: update notes and make one focused commit when the task is complete.

## Scope

### Required

- A deterministic sensor simulator.
- A local MQTT broker.
- A consumer that validates incoming events.
- Explicit rules for deciding OFF, HEAT, or COOL from room temperature and a homeowner-selected comfort range.
- A documented deadband or hysteresis rule so small temperature changes do not repeatedly switch modes.
- Persistent current operating mode for the simulated unit.
- An append-only command or transition history.
- Event IDs and idempotent duplicate handling.
- Correct behaviour under concurrent events for the same home unit.
- Unit tests for domain rules.
- Integration tests for persistence and one end-to-end flow.
- Structured logs with correlation fields such as event ID, sensor ID, and zone ID.
- Docker Compose for reproducible local execution.
- A controlled load test with honest measurements.
- README setup instructions and short Architecture Decision Records.

### Explicitly Out of Scope for Month One

- A frontend.
- User authentication and authorization.
- Physical IoT hardware.
- Real HVAC actuation or equipment-safety certification.
- Multiple rooms, zones, or buildings.
- Live weather-forecast integration.
- Occupancy sensing and time-of-day schedules (later rule extensions).
- Multiple cloud providers.
- AWS deployment.
- Four independently deployed microservices.
- Kubernetes and Horizontal Pod Autoscaling.
- Prometheus and Grafana.
- Artificial intelligence or predictive automation.
- A claim of production readiness.
- A device-count or building-scale performance claim.

Kubernetes is post-month-one work, not a month-one success criterion.

## Behavioural Requirements

1. A simulated home sensor can publish a reading containing an event ID, sensor ID, zone ID, timestamp, and room temperature.
2. The system accepts lower and upper comfort bounds representing homeowner preference; the first slice may use documented configuration rather than a UI.
3. The system rejects malformed or semantically invalid readings without changing the operating mode.
4. A valid reading crossing the documented heating or cooling entry threshold requests HEAT or COOL. The documented deadband or hysteresis rule determines when an active mode returns to OFF.
5. A transition-history record is created only when the effective simulated mode changes.
6. Processing the same event more than once produces the same final result and no duplicate command.
7. Concurrent events must not corrupt current mode or create an impossible transition history. The policy for out-of-order timestamps must be explicit.
8. The application shuts down without abandoning in-flight work beyond its documented delivery guarantee.
9. Test and load-test results must distinguish attempted, accepted, rejected, duplicated, failed, and successfully processed events.

## Initial Invariants

These statements must remain true regardless of framework or database choice:

- The simulated air-conditioning unit has exactly one current effective mode: OFF, HEAT, or COOL.
- HEAT and COOL are mutually exclusive.
- Transition history describes mode changes, not every temperature reading.
- An event ID identifies one logical sensor event.
- Reprocessing an event ID cannot repeat its business effect.
- Invalid input does not partially modify persistent state.
- A small change near a comfort boundary does not cause uncontrolled rapid switching under the documented rule.
- Infrastructure code does not contain the automation rules.
- Domain logic can be tested without starting MQTT, Docker, or a database.
- A passing health endpoint does not by itself prove that event processing is correct.

## Architecture Direction

Start as a modular monolith with explicit boundaries:

```text
Simulator
   |
   v
MQTT adapter -> Ingestion application service -> Automation domain logic
                                                   |
                                                   v
                                   State-transition application service
                                                   |
                                                   v
                                       Persistence interfaces/adapters
```

This is an initial direction, not an unquestionable answer. The developer must document why it is appropriate for month one and what evidence would justify extracting a service later.

TypeScript/Node.js is the chosen learning direction, but libraries, persistence technology, and MQTT broker are not finalised. During Week 1, the developer will record the smallest defensible choices in ADRs. AWS IoT Core can be reconsidered only after correctness is established locally.

## Project-Wide Definition of Done

A task is complete only when all applicable items are true:

- Its observable behaviour and acceptance criteria are satisfied.
- A focused automated test protects the important behaviour or failure case.
- Existing tests still pass.
- The application builds and static checks pass without newly suppressed warnings.
- No test was skipped, weakened, or deleted merely to obtain a green result.
- No credential, certificate, connection string, or `.env` file is committed.
- Names and module boundaries communicate intent.
- Error behaviour is explicit and tested where important.
- Documentation or an ADR is updated when a decision changed.
- The developer can explain the implementation, alternative considered, and principal failure mode.
- The diff has been reviewed before a focused commit is created.

Manual testing alone does not satisfy the Definition of Done when the behaviour can be automated.

## Mentor-Developer Working Agreement

For each task:

1. The mentor states the outcome and relevant constraints.
2. The developer explains the expected data/control flow before coding.
3. The developer proposes the smallest implementation and an important failure test.
4. The developer implements the slice.
5. The mentor reviews in this order: correctness, state/data flow, failure handling, tests, clarity, maintainability, then security/performance.
6. The developer proposes fixes for review findings before receiving complete replacement code.
7. The task closes only after the developer explains what was learned.

When blocked, assistance should normally progress through: focused question, concept, hint, pseudocode, reduced example, review of the attempted implementation, and only then a complete solution if genuinely necessary.

## Four-Week Plan

### Week 1: Understand Before Building

Goal: replace assumptions with explicit requirements, invariants, and a defensible architecture.

#### Day 1 - Repository and engineering contract

- Establish repository hygiene and secret-handling rules.
- Read the old reports as historical evidence, not as implementation instructions.
- Write the project problem statement, month-one scope, and Definition of Done.
- Record an initial list of unknowns without trying to solve all of them.

Deliverable: clean repository foundation and agreed learning contract.

#### Day 2 - Extract reusable lessons from the legacy system

- Sketch the 6.3D and 6.4HD event flows, then verify them against the documents/code.
- Identify trust boundaries, state owners, synchronous calls, MQTT subscriptions, and persistence writes.
- Explain which fan-out, duplicate-processing, read-before-write race, and autoscaling-signal lessons transfer to a home climate controller.
- Do not copy lighting-specific domain rules into the new requirements.

Deliverable: `documents/legacy-analysis.md` and one architecture diagram.

#### Day 3 - Requirements and invariants

- Define the minimal user/system behaviours.
- Define event fields and validation rules.
- Define delivery and ordering assumptions.
- Define measurable success and explicit non-goals.

Deliverable: `documents/requirements.md`.

#### Day 4 - Architecture and technology decisions

- Compare modular monolith versus immediate microservices.
- Record why TypeScript/Node.js serves the learning goal and what runtime or library choices remain open.
- Compare persistence options for atomic transition and idempotency requirements.
- Select a local MQTT broker and explain why cloud integration is deferred.

Deliverables: ADRs for architecture, implementation stack, and persistence.

#### Day 5 - First climate-control decision in tests

- Scaffold only what is needed to execute tests.
- Write the first failing examples for OFF/HEAT/COOL decisions.
- Implement the minimum pure domain logic needed to pass them.
- Refactor names and boundaries only after the tests pass.

Checkpoint: a mode decision can be demonstrated entirely in tests without infrastructure.

### Week 2: Make State Changes Correct

Goal: implement and prove the core behaviour before introducing MQTT.

#### Day 6 - Event model and validation

- Define the sensor-event contract.
- Separate structural validation from business rules.
- Test missing identifiers, invalid values, and timestamp assumptions.

#### Day 7 - Operating-mode transition model

- Model current mode and transition history.
- Ensure an unchanged desired mode produces no command.
- Test unknown-to-mode, OFF-to-HEAT, HEAT-to-OFF, OFF-to-COOL, and no-change cases.
- Test the selected deadband/hysteresis boundaries and direct HEAT-to-COOL policy.

#### Day 8 - Idempotency

- Decide where processed event IDs are recorded.
- Define the atomic boundary between event acceptance, state update, and history creation.
- Prove duplicate delivery has no repeated business effect.

#### Day 9 - Persistence adapter

- Add the selected database locally.
- Implement repository interfaces/adapters required by one vertical slice.
- Add integration tests using an isolated test database.

#### Day 10 - Concurrency and checkpoint

- Write a reproducible concurrent-event test for one simulated home unit.
- Gather evidence of any race before changing code.
- Implement the smallest defensible correction.
- Review the complete Week 2 diff.

Checkpoint: core state transitions are tested, persistent, idempotent, and safe under the documented concurrency model.

### Week 3: Add the Messaging Boundary

Goal: connect real asynchronous infrastructure without moving business rules into adapters.

#### Day 11 - Local MQTT broker

- Add the broker to local development configuration.
- Document topics, QoS choice, retained-message policy, and client identity.
- Verify publish/subscribe behaviour manually once.

#### Day 12 - Deterministic sensor simulator

- Create configurable event interval, seed, and run duration for one simulated zone.
- Generate valid and intentionally invalid events.
- Ensure a test run can be reproduced from the same seed.

#### Day 13 - MQTT consumer adapter

- Parse and validate incoming messages.
- Pass valid events to the existing application boundary.
- Record rejected messages without crashing the consumer.
- Keep MQTT-specific types outside domain logic.

#### Day 14 - Failure lifecycle

- Handle broker disconnection and reconnection.
- Define what happens to an in-flight event during shutdown.
- Implement graceful shutdown.
- Document what the system does and does not guarantee.

#### Day 15 - End-to-end checkpoint

- Run simulator -> broker -> consumer -> decision -> persistence.
- Automate at least one end-to-end integration scenario.
- Verify accepted, rejected, duplicate, and transition counts.
- Review boundaries and simplify accidental complexity.

Checkpoint: one command starts the local dependencies and the complete event flow works with evidence.

### Week 4: Measure, Review, and Present

Goal: obtain honest evidence and prepare a repository that can withstand interview questions.

#### Day 16 - Observability for questions we actually have

- Add structured fields needed to trace a temperature event through the system.
- Define counters for attempted, accepted, rejected, duplicate, failed, and transitioned events.
- Avoid installing a large monitoring stack unless simple instrumentation is insufficient.

#### Day 17 - Load-test design

- Write the hypothesis before running the test.
- Define workload, ramp pattern, duration, success criteria, and machine limitations.
- Separate connected clients from events per second; do not present a one-home workload as building-scale proof.
- Capture throughput, latency percentiles, errors, duplicates, and resource usage.

#### Day 18 - Baseline and bottleneck investigation

- Run at least three repeatable workloads.
- Change one workload variable at a time.
- Identify the first observed bottleneck using evidence rather than assumptions.
- Record results, environment, and limitations.

#### Day 19 - Reproducible packaging

- Add the application and dependencies to Docker Compose.
- Verify startup from a clean environment using documented commands.
- Confirm secrets remain outside version control.
- Add a failure-oriented smoke test.

#### Day 20 - Final review and explain-back

- Run the full quality gate.
- Review repository history and remove misleading claims or generated clutter.
- Finish README, architecture diagram, ADR index, and test/load-test instructions.
- Explain the architecture, mode-transition invariants, failure modes, measurements, and next scaling step without notes.
- Decide whether the evidence is sufficient for a resume entry.

Checkpoint: the month-one system is correct within its stated guarantees, reproducible, measured, documented, and explainable.

## Quality Gates

### End of Week 1

- Requirements and non-goals are written.
- Important invariants are explicit.
- Architecture and technology choices have recorded alternatives and rationale.
- Pure automation logic is protected by tests.

### End of Week 2

- Duplicate delivery is tested.
- Concurrent processing is tested.
- Current mode and transition history remain consistent.
- Database integration tests are reproducible.

### End of Week 3

- The complete local event flow works.
- Invalid messages do not crash or mutate state.
- Shutdown and reconnection behaviour are documented.
- One end-to-end path is automated.

### End of Week 4

- A clean setup can be reproduced from the README.
- All tests and static checks pass.
- Load-test evidence includes limitations.
- Secrets are absent from Git.
- The developer can defend every resume bullet derived from the project.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Copying the old lighting architecture into a different domain | High | Extract reusable failure lessons, then derive climate-control requirements independently. |
| Treating simulated commands as safe physical HVAC control | High | Keep real actuation out of scope and label the simulator's guarantees honestly. |
| Temperature noise causing rapid mode changes | High | Define and test deadband or hysteresis before persistence and MQTT. |
| Adding Kubernetes to satisfy a resume keyword | High | Treat Kubernetes as post-month-one work unless all required gates pass early. |
| Mentor writes too much implementation | High | Developer proposes and implements first; use the assistance ladder. |
| Spending days choosing tools | Medium | Time-box comparisons and choose the simplest option satisfying the invariants. |
| Tests are postponed | High | Behaviour changes are incomplete until the relevant automated test exists. |
| Load testing measures only client count | High | Measure event rate, latency, errors, loss, duplication, and resource use; avoid extrapolating to buildings. |
| Secrets enter version control | High | Add ignore rules immediately and inspect staged changes before every commit. |
| Four-to-five-hour sessions cause fatigue | Medium | Use focused blocks, stop at one completed slice, and keep two rest days. |
| Scope expands during the month | High | Add ideas to a post-month-one backlog; do not insert them into the active task list. |

## Open Questions for Week 1

- Which TypeScript runtime, test runner, and validation approach keep the first domain test simple?
- What should happen to old or out-of-order room-temperature readings?
- How should hysteresis and a direct HEAT-to-COOL change behave in the simulated controller?
- Which persistence technology best demonstrates the required atomic and idempotent behaviour without unnecessary complexity?
- What MQTT QoS and delivery assumptions will month one support?
- What is the smallest meaningful workload for the first benchmark?
- Which resume roles should the finished project target: backend, platform/cloud, or both?

These questions should be resolved through short written decisions, not informal assumptions.

## Post-Month-One Backlog

Only consider these after the final checkpoint:

- Add occupancy and time-of-day rules, with tests for missing or stale signals.
- Evaluate live weather forecasts, including provider failure and stale data.
- Extend from one home zone to multiple rooms and then buildings.
- Evaluate real-equipment constraints separately with appropriate domain expertise.
- Extract services where independent scaling or failure isolation is justified.
- Introduce shared MQTT subscription groups or a queue/consumer-group architecture.
- Add retry policies, bounded queues, backpressure, and dead-letter handling.
- Add Kubernetes Deployments, Services, probes, and resource configuration.
- Select workload-driven autoscaling metrics and compare them with CPU-based HPA.
- Run failure experiments and larger controlled load tests.
- Add cloud integration after local correctness is reproducible.

