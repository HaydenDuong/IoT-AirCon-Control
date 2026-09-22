# Implementation Plan: Smart Home Lighting System Rework

## Purpose

This is a four-week, learning-first rebuild of the university IoT smart-lighting project. The objective is not to reproduce the old repository as quickly as possible. The objective is to build one small, correct, measurable system that the developer can explain and defend without assistance.

The developer remains the primary implementer. The mentor provides requirements, questions, hints, review, and explanations, but does not take over implementation.

## One-Month Outcome

At the end of four weeks, the repository should demonstrate this complete flow:

```text
Sensor simulator
    -> MQTT broker
    -> validated sensor event
    -> automation decision
    -> idempotent light-state transition
    -> persisted state and command history
```

The result should be locally reproducible, tested, documented, and measured. It should be suitable for a narrow and honest resume entry, but it is not expected to match every feature of the old 6.3D and 6.4HD submissions.

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
- Explicit automation rules for light state decisions.
- Persistent current light state.
- An append-only command or transition history.
- Event IDs and idempotent duplicate handling.
- Correct behaviour under concurrent events for the same light.
- Unit tests for domain rules.
- Integration tests for persistence and one end-to-end flow.
- Structured logs with correlation fields such as event ID, device ID, and light ID.
- Docker Compose for reproducible local execution.
- A controlled load test with honest measurements.
- README setup instructions and short Architecture Decision Records.

### Explicitly Out of Scope for Month One

- A frontend.
- User authentication and authorization.
- Physical IoT hardware.
- Multiple cloud providers.
- AWS deployment.
- Four independently deployed microservices.
- Kubernetes and Horizontal Pod Autoscaling.
- Prometheus and Grafana.
- Artificial intelligence or predictive automation.
- A claim of production readiness.
- A target of 5,000 devices.

Kubernetes is a stretch goal only after all required correctness, testing, and documentation work is complete. The month does not fail if Kubernetes is absent.

## Behavioural Requirements

1. A sensor can publish a reading containing an event ID, device ID, light ID, timestamp, ambient-light value, and motion state.
2. The system rejects malformed or semantically invalid readings without changing light state.
3. Motion detected in low ambient light requests the light to be on.
4. No motion, or sufficient ambient light, requests the light to be off.
5. A command-history record is created only when the effective light state changes.
6. Processing the same event more than once produces the same final result and no duplicate command.
7. Concurrent events must not corrupt current state or create an impossible transition history.
8. The application shuts down without abandoning in-flight work beyond its documented delivery guarantee.
9. Test and load-test results must distinguish attempted, accepted, rejected, duplicated, failed, and successfully processed events.

## Initial Invariants

These statements must remain true regardless of framework or database choice:

- A light has exactly one current effective state.
- Command history describes actual state transitions, not every sensor reading.
- An event ID identifies one logical sensor event.
- Reprocessing an event ID cannot repeat its business effect.
- Invalid input does not partially modify persistent state.
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

Technology choices are deliberately not finalised in this plan. During Week 1, the developer will compare the smallest reasonable options and record the decision in an ADR. The default recommendation is a local MQTT broker first; AWS IoT Core can be reconsidered after correctness is established locally.

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

#### Day 2 - Reconstruct and critique the legacy system

- Draw the 6.3D and 6.4HD event flows from memory, then verify them against the documents/code.
- Identify trust boundaries, state owners, synchronous calls, MQTT subscriptions, and persistence writes.
- Explain the fan-out, duplicate-processing, read-before-write race, and weak autoscaling-signal risks.

Deliverable: `documents/legacy-analysis.md` and one architecture diagram.

#### Day 3 - Requirements and invariants

- Define the minimal user/system behaviours.
- Define event fields and validation rules.
- Define delivery and ordering assumptions.
- Define measurable success and explicit non-goals.

Deliverable: `documents/requirements.md`.

#### Day 4 - Architecture and technology decisions

- Compare modular monolith versus immediate microservices.
- Compare the candidate language/runtime options.
- Compare persistence options for atomic transition and idempotency requirements.
- Select a local MQTT broker and explain why cloud integration is deferred.

Deliverables: ADRs for architecture, implementation stack, and persistence.

#### Day 5 - First vertical slice in tests

- Scaffold only what is needed to execute tests.
- Write the first failing examples for automation decisions.
- Implement the minimum pure domain logic needed to pass them.
- Refactor names and boundaries only after the tests pass.

Checkpoint: the automation decision can be demonstrated entirely in tests without infrastructure.

### Week 2: Make State Changes Correct

Goal: implement and prove the core behaviour before introducing MQTT.

#### Day 6 - Event model and validation

- Define the sensor-event contract.
- Separate structural validation from business rules.
- Test missing identifiers, invalid values, and timestamp assumptions.

#### Day 7 - State-transition model

- Model current state and transition history.
- Ensure unchanged desired state produces no command.
- Test unknown-to-off, off-to-on, on-to-off, and no-change cases.

#### Day 8 - Idempotency

- Decide where processed event IDs are recorded.
- Define the atomic boundary between event acceptance, state update, and history creation.
- Prove duplicate delivery has no repeated business effect.

#### Day 9 - Persistence adapter

- Add the selected database locally.
- Implement repository interfaces/adapters required by one vertical slice.
- Add integration tests using an isolated test database.

#### Day 10 - Concurrency and checkpoint

- Write a reproducible concurrent-event test for one light.
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

- Create configurable device count, interval, seed, and run duration.
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

- Add structured fields needed to trace an event through the system.
- Define counters for attempted, accepted, rejected, duplicate, failed, and transitioned events.
- Avoid installing a large monitoring stack unless simple instrumentation is insufficient.

#### Day 17 - Load-test design

- Write the hypothesis before running the test.
- Define workload, ramp pattern, duration, success criteria, and machine limitations.
- Separate connected clients from events per second.
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
- Explain the architecture, invariants, failure modes, measurements, and next scaling step without notes.
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
- Current state and transition history remain consistent.
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
| Recreating the old architecture before understanding it | High | Start with invariants and a modular monolith; require an ADR before splitting services. |
| Adding Kubernetes to satisfy a resume keyword | High | Treat Kubernetes as post-month-one work unless all required gates pass early. |
| Mentor writes too much implementation | High | Developer proposes and implements first; use the assistance ladder. |
| Spending days choosing tools | Medium | Time-box comparisons and choose the simplest option satisfying the invariants. |
| Tests are postponed | High | Behaviour changes are incomplete until the relevant automated test exists. |
| Load testing measures only client count | High | Measure event rate, latency, errors, loss, duplication, and resource use. |
| Secrets enter version control | High | Add ignore rules immediately and inspect staged changes before every commit. |
| Four-to-five-hour sessions cause fatigue | Medium | Use focused blocks, stop at one completed slice, and keep two rest days. |
| Scope expands during the month | High | Add ideas to a post-month-one backlog; do not insert them into the active task list. |

## Open Questions for Week 1

- Which language/runtime will best serve the learning goal: TypeScript/Node.js or C#/.NET?
- Which persistence technology best demonstrates the required atomic and idempotent behaviour without unnecessary complexity?
- What MQTT QoS and delivery assumptions will month one support?
- What is the smallest meaningful workload for the first benchmark?
- Which resume roles should the finished project target: backend, platform/cloud, or both?

These questions should be resolved through short written decisions, not informal assumptions.

## Post-Month-One Backlog

Only consider these after the final checkpoint:

- Extract services where independent scaling or failure isolation is justified.
- Introduce shared MQTT subscription groups or a queue/consumer-group architecture.
- Add retry policies, bounded queues, backpressure, and dead-letter handling.
- Add Kubernetes Deployments, Services, probes, and resource configuration.
- Select workload-driven autoscaling metrics and compare them with CPU-based HPA.
- Run failure experiments and larger controlled load tests.
- Add cloud integration after local correctness is reproducible.

