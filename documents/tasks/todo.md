# Smart Home Lighting Rework - Month One Task List

Complete tasks in order. Work on only one task at a time. Do not mark a task complete until its acceptance criteria, verification, explain-back, and focused commit are complete.

Commands marked `TBD` are chosen after the implementation stack is recorded in an ADR.

## Task 1: Establish repository hygiene

**Description:** Create the minimum repository structure and safeguards required to work without committing generated output or secrets.

**Acceptance criteria:**

- [x] Repository contains an appropriate `.gitignore` and a safe configuration example where needed.
- [x] Credentials, certificates, local databases, dependency folders, and `.env` files are excluded.
- [x] The working tree contains only intentional project files.

**Verification:**

- [x] Inspect ignored and tracked files with Git.
- [x] Inspect the staged diff before committing.
- [x] Explain why an ignored secret that was previously committed is still compromised.

**Dependencies:** None

**Estimated scope:** Small

## Task 2: Write the month-one problem statement

**Description:** Describe the user/system problem, the single end-to-end outcome, non-goals, and measurable meaning of correctness and scalability.

**Acceptance criteria:**

- [ ] Functional requirements describe observable behaviour without prescribing frameworks.
- [ ] Non-functional requirements contain measurable or explicitly bounded expectations.
- [ ] Month-one non-goals prevent Kubernetes, cloud, UI, and service-splitting scope creep.

**Verification:**

- [ ] Review `documents/requirements.md` against the plan.
- [ ] Explain the difference between a requirement and an implementation choice.

**Dependencies:** Task 1

**Estimated scope:** Small

## Task 3: Reconstruct the legacy architecture

**Description:** Analyse the old 6.3D and 6.4HD systems to understand their data flow, state ownership, scaling model, and observed failures.

**Acceptance criteria:**

- [ ] Diagram identifies publishers, broker, subscribers, synchronous calls, state owners, and persistence writes.
- [ ] Analysis explains MQTT fan-out, duplicate effects, the light-state race, and limitations of CPU-only scaling.
- [ ] Claims distinguish observed evidence from hypotheses.

**Verification:**

- [ ] Walk through one sensor event from publication to command history.
- [ ] Explain why adding replicas may increase work instead of distributing it.

**Dependencies:** Task 2

**Estimated scope:** Medium

## Checkpoint A: Problem understanding

- [ ] Tasks 1-3 satisfy their acceptance criteria.
- [ ] No application implementation has started.
- [ ] Developer can explain what was wrong with the old system without reading the report.
- [ ] Review with mentor before proceeding.

## Task 4: Define the event contract and invariants

**Description:** Specify the sensor-event fields, validation rules, identity, ordering assumptions, and business invariants.

**Acceptance criteria:**

- [ ] Event contract includes event ID, device ID, light ID, timestamp, light measurement, and motion state.
- [ ] Structural and semantic validation rules are distinguishable.
- [ ] Idempotency, state consistency, and command-history invariants are explicit.

**Verification:**

- [ ] Review examples of valid, structurally invalid, and semantically invalid events.
- [ ] Explain why a device ID is not necessarily a unique event ID.

**Dependencies:** Task 3

**Estimated scope:** Small

## Task 5: Record initial architecture decisions

**Description:** Compare reasonable options and select the month-one architecture, runtime, persistence technology, and local MQTT broker.

**Acceptance criteria:**

- [ ] Each ADR records context, options, decision, consequences, and revisit conditions.
- [ ] Modular monolith versus microservices is explicitly considered.
- [ ] Choices are justified by current requirements rather than resume keywords.

**Verification:**

- [ ] Mentor reviews ADRs.
- [ ] Developer explains one rejected alternative fairly.

**Dependencies:** Task 4

**Estimated scope:** Medium

## Task 6: Scaffold the smallest testable application

**Description:** Create only enough project structure to build, run static checks, and execute one failing domain test.

**Acceptance criteria:**

- [ ] Build and test commands are documented.
- [ ] One intentionally failing automation-rule test demonstrates the test harness.
- [ ] No MQTT or database dependency is required for the test.

**Verification:**

- [ ] Tests initially fail for the expected reason.
- [ ] Build succeeds: `TBD`.
- [ ] Tests run: `TBD`.

**Dependencies:** Task 5

**Estimated scope:** Small

## Task 7: Implement automation decisions with TDD

**Description:** Implement pure business logic for deciding the desired light state from a validated reading.

**Acceptance criteria:**

- [ ] Motion plus low light requests ON.
- [ ] No motion requests OFF.
- [ ] Sufficient ambient light requests OFF.
- [ ] Boundary values and unsupported values have intentional behaviour.

**Verification:**

- [ ] Focused unit tests pass: `TBD`.
- [ ] Mutation of input is absent or explicitly justified.
- [ ] Explain why this logic belongs outside the MQTT consumer.

**Dependencies:** Task 6

**Estimated scope:** Medium

## Checkpoint B: Pure domain behaviour

- [ ] Tasks 4-7 satisfy their acceptance criteria.
- [ ] Domain tests run without infrastructure.
- [ ] Naming and boundaries have been reviewed.
- [ ] Review with mentor before persistence work.

## Task 8: Model state transitions

**Description:** Convert a desired state into either a real transition with command history or a no-change result.

**Acceptance criteria:**

- [ ] Unknown, ON, and OFF current states are handled intentionally.
- [ ] A history record is produced only for an effective state change.
- [ ] Transition reason and source event ID are retained.

**Verification:**

- [ ] Unit tests cover unknown-to-state, ON-to-OFF, OFF-to-ON, and unchanged cases.
- [ ] Explain the difference between a sensor reading, decision, and command.

**Dependencies:** Task 7

**Estimated scope:** Medium

## Task 9: Design idempotent event processing

**Description:** Define and test how duplicate delivery is detected without repeating a state transition or history entry.

**Acceptance criteria:**

- [ ] Processed event identity has a single authoritative location.
- [ ] Repeating an event produces no repeated business effect.
- [ ] The atomicity requirement covering event, state, and history is documented.

**Verification:**

- [ ] Duplicate-event unit or component test passes.
- [ ] Explain why an in-memory set is insufficient after restart or with multiple instances.

**Dependencies:** Task 8

**Estimated scope:** Medium

## Task 10: Implement the persistence adapter

**Description:** Persist processed events, current state, and transition history using the selected database behind explicit application interfaces.

**Acceptance criteria:**

- [ ] Schema enforces important uniqueness and relationship constraints.
- [ ] Application/domain code does not depend directly on database-specific types.
- [ ] One transaction or atomic operation protects the documented consistency boundary.

**Verification:**

- [ ] Integration tests run against an isolated database.
- [ ] Inspect stored current state and transition history for one scenario.
- [ ] Explain what happens if persistence fails halfway through processing.

**Dependencies:** Task 9

**Estimated scope:** Medium

## Task 11: Prove concurrent behaviour

**Description:** Reproduce simultaneous processing for the same light and prove the persistence design maintains its invariants.

**Acceptance criteria:**

- [ ] Test starts concurrent operations rather than merely executing quickly in sequence.
- [ ] Final current state and history remain internally consistent.
- [ ] Any ordering limitation is documented instead of hidden.

**Verification:**

- [ ] Concurrent integration test passes repeatedly.
- [ ] Evidence from the failing implementation is retained in notes if a race was discovered.
- [ ] Explain why read-then-write can race.

**Dependencies:** Task 10

**Estimated scope:** Medium

## Checkpoint C: Correct state processing

- [ ] Tasks 8-11 satisfy their acceptance criteria.
- [ ] Unit and integration tests pass: `TBD`.
- [ ] Duplicate and concurrent inputs are covered.
- [ ] Review with mentor before adding MQTT.

## Task 12: Add a local MQTT broker

**Description:** Configure a reproducible local broker and document the messaging contract without changing domain behaviour.

**Acceptance criteria:**

- [ ] Broker starts through a documented local-development command.
- [ ] Topic naming, QoS, retained-message policy, and client-ID policy are documented.
- [ ] No credentials are committed.

**Verification:**

- [ ] Manually publish and receive one test message.
- [ ] Stop and restart the broker and record expected client behaviour.
- [ ] Explain the selected QoS trade-off.

**Dependencies:** Checkpoint C

**Estimated scope:** Small

## Task 13: Build a deterministic simulator

**Description:** Create a repeatable sensor workload rather than an uncontrolled random script.

**Acceptance criteria:**

- [ ] Device count, interval, duration, and random seed are configurable.
- [ ] Events have unique IDs and valid timestamps.
- [ ] The same seed and configuration reproduce the same logical sequence.

**Verification:**

- [ ] Automated tests cover deterministic generation.
- [ ] Two runs with the same seed are compared.
- [ ] Explain why reproducibility matters when diagnosing performance or correctness.

**Dependencies:** Task 12

**Estimated scope:** Medium

## Task 14: Implement the MQTT consumer adapter

**Description:** Translate incoming MQTT payloads into the existing application boundary while isolating transport-specific concerns.

**Acceptance criteria:**

- [ ] Valid payload reaches the processing use case.
- [ ] Malformed and semantically invalid payloads are rejected without state mutation.
- [ ] Consumer failure does not terminate the process without an intentional policy.

**Verification:**

- [ ] Adapter/component tests pass.
- [ ] Manual invalid-message check is recorded.
- [ ] Explain where parsing ends and business processing begins.

**Dependencies:** Tasks 12-13

**Estimated scope:** Medium

## Task 15: Define reconnection and graceful shutdown

**Description:** Make process lifecycle behaviour explicit for broker interruption and application termination.

**Acceptance criteria:**

- [ ] Reconnection policy is bounded or otherwise documented.
- [ ] New work stops during shutdown and resources close cleanly.
- [ ] In-flight event behaviour is consistent with the documented delivery guarantee.

**Verification:**

- [ ] Broker interruption and recovery are tested manually or automatically.
- [ ] Shutdown check confirms the process exits cleanly.
- [ ] Explain one event-loss or duplicate-delivery window that may remain.

**Dependencies:** Task 14

**Estimated scope:** Medium

## Task 16: Automate one end-to-end event flow

**Description:** Prove the complete simulator-to-persistence path using a reproducible integration scenario.

**Acceptance criteria:**

- [ ] One command starts required local dependencies.
- [ ] Test observes persisted state and expected transition history.
- [ ] Scenario includes at least one duplicate and one invalid event.

**Verification:**

- [ ] End-to-end test or scripted verification passes repeatedly.
- [ ] Counts for accepted, rejected, duplicate, and transitioned events match expectations.
- [ ] Explain the boundaries not covered by this test.

**Dependencies:** Task 15

**Estimated scope:** Medium

## Checkpoint D: Complete event path

- [ ] Tasks 12-16 satisfy their acceptance criteria.
- [ ] Full local flow is reproducible.
- [ ] Failure and lifecycle behaviour are documented.
- [ ] Review with mentor before performance work.

## Task 17: Add focused structured instrumentation

**Description:** Expose enough information to answer correctness and performance questions without installing an excessive monitoring stack.

**Acceptance criteria:**

- [ ] Logs carry event ID, device ID, light ID, outcome, and elapsed time where relevant.
- [ ] Counters distinguish attempted, accepted, rejected, duplicate, failed, and transitioned events.
- [ ] Sensitive payloads and credentials are not logged.

**Verification:**

- [ ] Trace one event through logs using its event ID.
- [ ] Counter totals match a controlled test scenario.
- [ ] Explain the difference between logs, metrics, and traces.

**Dependencies:** Checkpoint D

**Estimated scope:** Medium

## Task 18: Specify the load test before running it

**Description:** Write a falsifiable hypothesis, workload model, environment description, and success criteria.

**Acceptance criteria:**

- [ ] Plan defines device count, event rate, ramp, duration, and payload mix.
- [ ] Measurements include throughput, latency percentiles, errors, duplicates, and resource use.
- [ ] Machine and local-environment limitations are documented.

**Verification:**

- [ ] Mentor reviews the experiment before execution.
- [ ] Explain why connected-client count alone is insufficient.

**Dependencies:** Task 17

**Estimated scope:** Small

## Task 19: Run and analyse controlled workloads

**Description:** Execute repeatable tests, change one independent variable at a time, and identify the first evidence-supported bottleneck.

**Acceptance criteria:**

- [ ] At least three workloads are executed with recorded configuration.
- [ ] Raw results and a concise interpretation are retained.
- [ ] Conclusions distinguish correlation, observation, and unverified explanation.

**Verification:**

- [ ] Re-run one workload and compare variance.
- [ ] Verify database counts against application counters.
- [ ] Explain what the experiment did not prove.

**Dependencies:** Task 18

**Estimated scope:** Medium

## Task 20: Package the complete local system

**Description:** Make application, broker, and database startup reproducible through Docker Compose while preserving the tested boundaries.

**Acceptance criteria:**

- [ ] Clean setup follows documented commands.
- [ ] Health checks reflect dependency readiness but do not claim business correctness.
- [ ] Configuration is injected without tracked secrets.

**Verification:**

- [ ] Build succeeds from documented commands.
- [ ] Smoke test passes after starting from a clean local state.
- [ ] Explain the difference between liveness, readiness, and functional correctness.

**Dependencies:** Task 19

**Estimated scope:** Medium

## Task 21: Complete repository and interview review

**Description:** Review the project as a public portfolio artifact and confirm that every claim is supported and explainable.

**Acceptance criteria:**

- [ ] README explains purpose, architecture, setup, testing, measurements, and limitations.
- [ ] ADR index and architecture diagram reflect the implementation.
- [ ] Repository contains no secret, misleading scalability claim, dead generated code, or unexplained dependency.

**Verification:**

- [ ] Full quality gate passes: build, tests, static checks, clean setup, and secret inspection.
- [ ] Developer completes an explain-back covering architecture, invariants, failure modes, trade-offs, and results.
- [ ] Resume bullets are written only from verified evidence.

**Dependencies:** Task 20

**Estimated scope:** Medium

## Final Checkpoint: Month-One Complete

- [ ] All required tasks and checkpoints are complete.
- [ ] All tests and static checks pass.
- [ ] Setup is reproducible from the README.
- [ ] Measurements include honest limitations.
- [ ] Git history and current tree contain no secrets.
- [ ] Developer can defend each architecture decision and resume claim.
- [ ] Mentor and developer decide whether to proceed to service extraction and Kubernetes.

## Post-Month-One Parking Lot

Add ideas here without expanding the active month-one scope:

- [ ] Evaluate service extraction using measured scaling/failure-isolation needs.
- [ ] Compare shared MQTT subscriptions with a queue/consumer-group architecture.
- [ ] Add bounded work queues, retry policy, and dead-letter handling.
- [ ] Add Kubernetes only after defining what behaviour it should improve.
- [ ] Compare workload-driven autoscaling with CPU-based HPA.
- [ ] Evaluate AWS IoT Core after local correctness and workload modelling are stable.

