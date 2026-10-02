# Legacy Architecture Analysis

## 1. Purpose

This document reconstructs the 6.3D and 6.4HD lighting systems from available evidence.

The goals are to:

- understand how sensor events flowed through each system;
- identify state ownership and persistence;
- identify reliability and scalability problems;
- decide which lessons transfer to the air-conditioning controller.

The legacy architectures are evidence, not requirements for the new system.

## 2. Evidence Method

This analysis reconstructs the legacy systems using retained source code, configuration, report content, deployment screenshots, test results, and firsthand knowledge from the original developer.

### Evidence classifications

- **Repository-observed:** directly supported by a standalone source-code or configuration file retained in the repository.
- **Report-verified:** supported by source code, configuration details, test results, or deployment screenshots contained in the submitted report.
- **Author-confirmed:** confirmed from firsthand knowledge of the original implementation, but not fully preserved in the available artifacts.
- **Inferred:** a conclusion derived from the available evidence but not demonstrated directly.

When different artifacts conflict, the discrepancy will be recorded rather than silently choosing one version.

Source code & runtime configuration are generally stronger evidence of implemented behaviour than a high-level description.

The original AWS account is no longer available. Consequently, the historical deployment cannot be executed / queried, but the retained report provides enough evidence to reconstruct its main components & event flow.

### Evidence table

| Claim | Classification | Evidence | Notes |
|---|---|---|---|
| AWS IoT Core operated as the MQTT broker | Repository-observed and report-verified | Node-RED MQTT configuration, sensor/test code, and report architecture diagram | The live broker can no longer be queried |
| Node-RED sent commands to API Gateway using HTTP | Repository-observed and report-verified | Node-RED flow configuration and report screenshots | The report identifies the HTTP endpoint |
| Lambda wrote records to both DynamoDB tables | Report-verified | Lambda source code in the report appendix | The source performs one `PutItem` operation for each table |

## 3. 6.3D — Serverless AWS Architecture

The 6.3D AWS deployment no longer exists because the associated AWS account is unavailable.

However, the submitted report retains historical deployment evidence, including AWS console screenshots, configuration details, Lambda source code, Node-RED logic, database schemas, and test results.

This evidence is sufficient to reconstruct the implemented architecture, although the deployment can no longer be queried or executed for additional verification.

### 3.1 Component Inventory

| Component | What does it do? | Receives data from | Sends data to |
|---|---|---|---|
| Sensor simulator | Creates simulated light and motion readings | — | AWS IoT Core |
| AWS IoT Core | Acts as a MQTT broker that receive the published MQTT messages and delivers them to matching subscribers (Node-RED) | Simulated Sensors | Node-RED |
| Node-RED | Collect data from sensors and sending corresponding resulting light command to actuators (Decision Engine) | AWS IoT Core | API Gateway |
| API Gateway | Receives incoming HTTP requests from Node-RED and direct it to AWS Lambda | Node-RED | AWS Lambda |
| AWS Lambda | Acts as a light actuator in this case | API Gateway | DynamoDB |
| DynamoDB LightCommands | A table designated for storing Light Commands only | AWS Lambda | - |
| DynamoDB LightStates | A table designated for storing Light State only | AWS Lambda | - |

## 3.2. 6.3D Event Flow

1. The sensor simulator sends simulated reading generated from "sensor-simulator.js" to AWS IoT Core
2. AWS IoT Core routes the incoming simulated reading from "sensor-simulator.js" to Node-RED (hosted on Amazon EC2)
3. Node-RED receives sensor readings, applies automation rules, and sends the resulting light command to API Gateway.
4. API Gateway receives HTTP request from Node-RED and routes this request to AWS Lambda
5. Lambda acts as a simulated light actuator, receives the light command from Node-RED, applies / simulates the requested state, and then creates:
    - A command-history record
    - A light-state record
    - Lambda transform an incoming command into database records.
6. DynamoDB housing both LightCommands & LightStates table where each stores immutable command-history records and stores time-stamped state records correspondingly.

### 3.3 State Ownership [Which component is responsible for creating / changing a piece of information, and where is that information stored?]

| State | Created or changed by | Stored in | Survives a restart? | Purpose | Evidence |
|---|---|---|---|---|---|
| Sensor reading | Sensor simulator or test generator | Transmitted through AWS IoT Core and processed by Node-RED. It is not stored as an independent sensor-reading record. When a command is emitted, the reading is embedded in the corresponding `LightCommands` record as `sensorData`. | Only readings included in persisted command records survive. Readings that produce no command are not stored. | Provides motion and light-intensity input to the automation rules. | Sensor test code, Node-RED flow, and Lambda appendix |
| Current decision state | Node-RED decision engine | In-memory `global.lightStates` map inside each Node-RED instance | No. A Node-RED restart or instance replacement clears the cache. | Allows Node-RED to compare the newly calculated state with the previous calculated state and suppress unchanged commands. | Node-RED decision-engine code and report state-change analysis |
| Automation rules | Node-RED flow configuration | Deployed Node-RED flow and the configured EC2/AMI | Yes, under a normal process restart because the deployed flow remains on disk. It is separate from the in-memory state cache. | Calculates the desired power and brightness from motion, light intensity, and time of day. | Node-RED flow configuration and report appendix |
| Command history | Lambda creates the record; DynamoDB stores it | DynamoDB `LightCommands` table | Yes | Provides a durable audit trail of commands, including the action, reason, status, and associated sensor data. | Lambda source code and DynamoDB screenshots |
| Light-state history | Lambda creates the record; DynamoDB stores it | DynamoDB `LightStates` table | Yes | Records the simulated effective light state over time for traceability and debugging. | Lambda source code and DynamoDB screenshots |

#### State-ownership observation

The system has two different representations of light state:

1. Node-RED maintains an in-memory calculated state used for state-change detection.
2. DynamoDB maintains durable, time-stamped state-history records.

The Node-RED cache is not recovered from DynamoDB. Therefore, after a Node-RED restart, the first reading for each light is treated as a state change because no previous cached state exists. Node-RED emits a command and stores the newly calculated state for comparison with subsequent readings.

When multiple Node-RED instances are running, each instance has its own `global.lightStates` cache. The cache is not shared between instances. As a result, different instances may hold different previous states for the same light.

Persistent history exists in DynamoDB tables, but, Node-RED does not use it to recover or share its decision state.

### 3.4 Synchronous and Asynchronous Communication

| Interaction | Communication style | Does the sender wait? | Effect of downstream failure | Evidence |
|---|---|---|---|---|
| Sensor simulator → AWS IoT Core | Asynchronous MQTT messaging | The simulator may receive a protocol-level publish acknowledgement depending on MQTT settings, but it does not wait for Node-RED to process the reading or produce a light command. | The reading may fail to reach the broker. Recovery and redelivery depend on MQTT QoS and session configuration. | Sensor simulator, state-validation test, load-test code, and report architecture diagram |
| AWS IoT Core → Node-RED | Asynchronous MQTT publish/subscribe messaging | AWS IoT Core routes the message to matching Node-RED subscribers without waiting for the complete automation and persistence process. | If Node-RED is unavailable, whether the message is recovered depends on MQTT QoS and session configuration. Successful delivery does not prove that the later HTTP request or database writes succeeded. | Node-RED MQTT configuration and report architecture diagram |
| Node-RED → API Gateway | Synchronous HTTP request/response | Node-RED sends a command through the HTTP Request node and waits for an HTTP response, error, or timeout. | API Gateway or network failure prevents the command from reaching Lambda. Node-RED may already have updated its in-memory state cache before the HTTP operation fails. | Node-RED flow configuration and HTTP Request node |
| API Gateway → Lambda | Synchronous Lambda invocation | API Gateway waits for Lambda to finish and uses the returned status, headers, and body to construct the HTTP response. | A Lambda error or timeout causes the API request to fail and an error response to be returned to Node-RED. | API Gateway configuration and Lambda response structure in the report |
| Lambda → DynamoDB `LightCommands` | Synchronous dependency implemented with asynchronous JavaScript I/O | Lambda uses `await` and does not continue until the `PutItem` operation succeeds or exhausts its retries. | After the configured retries fail, Lambda throws an error. The `LightStates` write is not attempted because the writes are sequential. | Lambda `retryOperation` and first `PutItemCommand` in the report appendix |
| Lambda → DynamoDB `LightStates` | Synchronous dependency implemented with asynchronous JavaScript I/O | Lambda waits for the second `PutItem` operation before returning a successful response. | If this write fails, Lambda returns an error, but the earlier `LightCommands` record may already exist. This creates a possible partial-write state. | Lambda `retryOperation` and second `PutItemCommand` in the report appendix |

#### Direct Function Processing

Inside Node-RED, the decision-engine function processes the received MQTT payload within the Node-RED runtime. It extracts motion and light-intensity values, calculates the desired power and brightness, compares the result with the previous state stored in `global.lightStates`, and either emits a command or returns `null`. This processing does not cross a network boundary.

Inside Lambda, the handler parses the API Gateway event, extracts the light identifier and request body, simulates applying the requested command, creates the command-history and light-state records, and calls the retry helper for both DynamoDB writes. These operations are direct function calls within the same Lambda invocation, although the DynamoDB operations themselves cross a network boundary.

#### Communication Summary

The sensor-ingestion side of the system is asynchronous:

`Sensor → AWS IoT Core → Node-RED`

The command-execution and persistence side is a synchronous request-response chain:

`Node-RED → API Gateway → Lambda → DynamoDB`

The use of JavaScript promises and `async`/`await` in Lambda does not make the service interaction architecturally asynchronous. Lambda still waits for both DynamoDB operations before returning success to API Gateway.

### 3.5 Problems and Uncertainties

| Finding | Type | Evidence | Failure scenario | Consequence | Lesson for the rework |
|---|---|---|---|---|---|
| The standalone `sensor-simulator.js` is incompatible with the retained decision flow | Observed artifact mismatch | The simulator publishes to `test/topic` and produces `ambientLight`. The retained Node-RED decision flow subscribes to `iot/sensors/+/+/+` and expects `lightId`, `light_intensity`, and `motion_detected`. The state-validation and load-test scripts use the expected topic and fields. | The standalone simulator is started against the retained Node-RED flow. Its messages do not match the subscribed topic. Even if the topic were changed, its payload would still not satisfy the decision engine’s expected contract. | The intended automation path cannot be exercised reliably with the standalone simulator. Missing fields may also be converted into misleading default values rather than rejected. | Define one explicit, version-controlled sensor-event contract. Validate every incoming event and add contract tests proving that the simulator and consumer agree. |
| The exported flow and report describe different MQTT subscription modes | Historical configuration uncertainty | The retained `flows.json` subscribes to `iot/sensors/+/+/+`. The report describes a shared subscription using `$share/nodered/iot/sensors/+/+/+`. | Multiple Node-RED instances are started, but the actual deployed subscription configuration cannot be established from the surviving artifacts. | It is unclear whether each reading was distributed to one Node-RED instance or delivered independently to multiple instances. Consequently, the original scaling and duplicate-processing behaviour cannot be proven. | Store runtime configuration in version control and test the actual delivery behaviour. Documentation should describe the deployed configuration rather than a possibly different intended configuration. |
| Missing or malformed fields are silently converted into valid-looking values | Observed validation weakness | The decision function uses expressions such as `sensorData.light_intensity \|\| 0` and `sensorData.motion_detected \|\| false`, while `lightId` is used without validation. | A producer sends a misspelled field, an incomplete payload, or an unsupported value. | Invalid input can be interpreted as zero light, no motion, or an undefined light identifier. The system may make a legitimate-looking but incorrect decision instead of reporting a contract violation. | Validate untrusted MQTT payloads at the system boundary. Reject invalid events explicitly and record why they were rejected. |
| Current decision state is lost when Node-RED restarts | Observed problem | Previous calculated states are stored in the in-memory `global.lightStates` map. The map is not reconstructed from DynamoDB. | The Node-RED process, EC2 instance, or replacement instance restarts. | The first subsequent reading for each light is treated as a state change because no previous cached state exists. This can produce an unnecessary duplicate command even when the desired state has not actually changed. | Place correctness-critical state in durable storage or implement an explicit recovery process before handling new events. An in-memory cache should not be the only source of truth. |
| Current decision state is not shared between Node-RED instances | Observed design limitation | `global.lightStates` belongs to an individual Node-RED runtime. No shared state store or device-affinity mechanism is evident. | One instance processes a light’s first reading and caches its state. A later reading for the same light is delivered to another instance. | The second instance has no previous state and may emit another command. Different replicas can hold different views of the same light, making horizontal scaling affect correctness. | Before scaling a stateful consumer, define how state is shared or how all events for one entity are routed consistently. Scaling stateless computation is simpler than scaling per-instance mutable state. |
| Node-RED updates its cache before the downstream HTTP command succeeds | Observed correctness problem | The decision function calls `global.lightStates.set(lightId, newState)` before returning the message to the downstream HTTP Request node. | Node-RED calculates `ON` and updates its cache, but the request to API Gateway times out or Lambda fails. The next sensor reading produces the same desired state. | Node-RED believes that the new state has already been handled and suppresses the next command, even though the original command may never have reached the actuator or database. The cache represents the calculated intention rather than confirmed execution. | Distinguish desired state, issued command, and confirmed applied state. Do not mark an operation successful before its required downstream effect has succeeded. |
| Events and commands do not have an enforceable idempotency mechanism | Observed design problem | No stable producer-generated event identifier, idempotency key, or database uniqueness rule is evident across the complete path. A timestamp or database-generated record identifier does not identify two deliveries as the same logical event. | MQTT redelivers a reading, an HTTP client retries after a timeout, or Node-RED emits the same logical command again after losing its cache. | The same logical operation may create multiple command and state-history records or repeat an actuator effect. | Give each logical event or command a stable identifier. Enforce uniqueness in persistent storage and make repeated processing return the existing result without repeating the effect. |
| The two DynamoDB writes are not atomic | Observed correctness problem | Lambda awaits a `PutItem` for `LightCommands` and then separately awaits a `PutItem` for `LightStates`. The operations are sequential but are not one transaction. | The command-history write succeeds, but the state-history write fails after all retries. | The database contains a command record without the corresponding state record. Returning an HTTP error does not undo the first successful write, and retrying may create further records. | Persist related changes in one database transaction where the invariant requires all-or-nothing behaviour. Sequential `await` calls do not provide atomicity. |
| Sensor readings that do not create commands are not retained independently | Observed design limitation | A reading is embedded in `LightCommands` only when Node-RED detects a state change. The decision function returns `null` for unchanged states. | Engineers need to investigate why no command was issued or replay historical readings against corrected automation rules. | The system does not contain a complete history of its inputs. It can show emitted commands but cannot fully reconstruct every decision or non-decision. | Decide explicitly whether complete input history is required. If auditability, replay, or algorithm evaluation matters, persist readings independently from commands. |
| The exact historical AWS deployment can no longer be inspected | Evidence limitation | The original AWS account is unavailable, and some retained artifacts conflict with the report. | An engineer attempts to verify MQTT session behaviour, QoS, shared-subscription configuration, deployed Lambda version, permissions, or scaling configuration. | Some historical claims must remain report-verified, author-confirmed, or inferred rather than runtime-verified. The deployment cannot be reproduced solely from the retained repository. | Keep deployable infrastructure, configuration, schemas, and verification instructions in version control. A reproducible system should not depend on an inaccessible cloud account. |

#### Overall Assessment

The 6.3D system successfully demonstrated an end-to-end path from simulated sensor readings through MQTT-based ingestion, rule evaluation, an HTTP API, a Lambda function, and durable history records. It also demonstrated several useful ideas that should be retained, including asynchronous sensor ingestion, separation of automation logic from simulation, and persistent command history.

However, the system’s correctness depended on process-local state that was neither durable nor shared. That state was updated before downstream success was known. The absence of a stable idempotency mechanism meant that retries, redelivery, restarts, and horizontal scaling could repeat effects. The two related database writes could also produce a partial result. Finally, inconsistencies between the retained simulator, exported flow, and reported deployment made the system difficult to reproduce and verify.

These findings explain why the air-conditioning project should be a deliberate rework rather than a direct copy or technology substitution. The rework should prioritise:

    1. one documented and runtime-validated event contract;
    2. explicit ownership of current device state;
    3. durable state required for correctness;
    4. clear separation between desired, commanded, and confirmed state;
    5. stable event and command identifiers;
    6. idempotent processing enforced by database constraints;
    7. atomic persistence of related changes;
    8. reproducible local infrastructure and configuration;
    9. failure-focused tests before horizontal scaling.

The goal of the rework is therefore not to reproduce the maximum number of AWS components. It is to build a smaller system whose behaviour remains explainable and correct during invalid input, duplicate delivery, downstream failure, application restart, and eventual scaling.

## 4. 6.4HD — Containerised Microservices Architecture

The 6.4HD implementation replaced the Node-RED and Lambda-based processing path with independently deployed Node.js services running in Kubernetes.

The architecture separated sensor-data persistence, automation decisions, light-state management, and external HTTP access. MongoDB provided shared durable storage, while AWS IoT Core remained the MQTT broker.

The implemented event path must be distinguished from the system's external HTTP API path. Automatic sensor processing through MQTT & does ot pass through the API Gateway.

### 4.1 Component Inventory

| Component | Responsibility | Receives through | Sends through | State owned |
|---|---|---|---|---|
| Sensor simulator & test generators | Simulate IoT devices & publish light-intensity and motion readings | Local simulation logic | MQTT publications to AWS IoT Core | Temporary simulation values such as battery level, generated readings, and connection state |
| AWS IoT Core | Operatte as the MQTT broker and route publications to matching subscribers | MQTT publications from sensor simulators | MQTT delivery to sensor-data and automation service replicas | MQTT connection, subscription, and session state; no application-domain light state |
| Sensor-data service | Consume and persist sensor readings & expose APIs for querying them | MQTT directly from AWS IoT Core / HTTP through the API Gateway | MongoDB writes and HTTP responses | Sensor-reading history stored in the 'sensorreadings' collection |
| Automation service | Evaluate automation rules & calculate the desired light state | MQTT directly form AWS IoT Core / manual HTTP requests | Synchronous HTTP request to the light-control service | Automation-rule configuration held in each process's memory |
| Light-control service | Compare desrired state with persisted current state, update the state, and record commands | Synchronous HTTP from the automation service / API Gateway | MongoDB reads & writes & HTTP responses | Current light state & command history stored in MongoDB |
| API gateway | Provide one external HTTP entry point & forward requests to internal services | External HTTP requests | Synchronous HTTP reuqests to the 3 internal serviecs | No durable domain state; rate-limiting data is local to each gateway process |
| MongoDB | Provide persistent storage shared by the services | Mongoose queries and writes | Query results and write acknowledgements | Sensor readings, current light states, and command-history records |
| Kubernetes | Deploy, restart, expose, and horizontally scale service replicas | Deployment manifests, health probes, and resource metrics | Pod lifecycle management & internal HTTP load balancing | Desired deployment and orchestration state; no lighting-domain state |

#### Component-boundary observation

Despites its name, the sensor-data service does not behave as a sensor & does not forward readings to the automation service. The simulator represents the IoT device. Both the sensor-data service & automation service independently subscribe to AWS IoT Core.

The automation service performs the decision-engine responsibility previously handled by Node-RED. The light-control srvice performs the simulated actuation, current-state, and command-history responsibilities previously associated with AWS Lambda & DynamoDB.

The customed Express API Gateway acts as an HTP facade and reverse proxy for external clients.

### 4.2 Sensor-Event Trace

| Step | Component | Input | Action | Output | State read or written | Evidence |
|---:|---|---|---|---|---|---|
| 1 | Sensor simulator or test generator | Locally generated light and motion values | Constructs a JSON sensor-reading payload and publishes it to an MQTT topic | MQTT publication under `iot/sensors/...` or `test/topic` | Reads and changes only local simulation state | Simulator and test-generator source code |
| 2 | AWS IoT Core | MQTT publication | Matches the topic against active subscriptions and delivers the payload to subscribers | MQTT delivery to the sensor-data and automation services | Uses broker connection and subscription state | MQTT configuration in both subscriber services |
| 3A | Sensor-data service | MQTT topic and JSON payload | Parses the payload, constructs a `SensorReading`, and saves it | MongoDB insert | Writes a document to `sensorreadings` | `sensor-data-service/server.js` and `SensorReading.js` |
| 3B | Automation service | The same MQTT topic and JSON payload | Parses the payload and invokes `processAutomationRules` | Calculated desired light state and reason | Reads automation rules stored in process memory | `automation-service/server.js` |
| 4 | Automation service | Sensor fields and calculated desired state | Sends an HTTP `POST` directly to the light-control service | Light-state update request | No durable state written by the automation service | `axios.post` call in `processAutomationRules` |
| 5 | Kubernetes light-control Service | HTTP request | Routes the request to one available light-control pod | HTTP request delivered to a pod | No domain state | Kubernetes `ClusterIP` service configuration |
| 6 | Light-control service | Desired state, light identifier, sensor context, and reason | Reads the current light state and compares it with the desired state | Either an unchanged response or a state-change operation | Reads `LightState` from MongoDB | `POST /api/lights/state` implementation |
| 7 | Light-control service | Detected state change | Updates the current state and creates a command-history record | Updated state, saved command, and HTTP response | Writes `LightState` and `LightCommand` | Light-control service and Mongoose models |
| 8 | Automation service | HTTP response from light-control | Logs whether the state changed and completes processing | Processing completion | No additional durable state | Automation-service response handling |

The automatic path is therefore:

    Sensor simulator
        → AWS IoT Core
            ├──→ Sensor-data service → MongoDB sensor-reading history
            └──→ Automation service
                    → Light-control service
                        → MongoDB light state and command history
    
    The API Gateway is not involved in this automatic MQTT path

#### Seperate HTTP paths

The API gateway provides additional request-response paths for external clients:

    External client
        → API gateway
            → Sensor-data service
            → Automation service
            → Light-control service

These following services routes do not all produce equivalent behavior:

    - POST /api/sensors/readings forwards a reading to the sensor-data service & stores it, but does not trigger automation.

    - POST /api/automation/process manually sends a reading to the automation service, which then invokes the light-control service.

    - POST /api/lights/state bypassess automation and sends a desired state directly to the light-control service.

    - Query routes expose sensor readings, light states, command history, rules, statistics, and health information.

Consequently, publishing through MQTT and submitting a sensor reading through the HTTP sensor endpoint do not produce the same end-to-end effect.

### 4.3 MQTT Fan-Out

Both the sensor-data service & automation service subscribe directly to: "iot/sensors/+/+/+" & "test/topic"

Each Kubernetes replica creates an independent MQTT client with a distinct client identifier. The subscriptions retained in the repository are ordinary, non-shared subscriptions.

    - With one sensor-data replica & one automation replica, one publication produces 2 intentional deliveries:

                            One delivery to sensor-data

                                        +
                            
                            One delivery to automation

    - This fan-out is valid, because the services perform different responsibilities:

        - One stores the reading.
        - The other reacts to it.

    - However, the Kubernetes deployments initially configure 3 sensor-data replicas & 3 automtation replicas. Because each replica uses an ordinary subscription => one publication can be delivered to every matching replica:

        One sensor publication
            |
            ├──→ Sensor-data pod 1
            ├──→ Sensor-data pod 2
            ├──→ Sensor-data pod 3
            |
            ├──→ Automation pod 1
            ├──→ Automation pod 2
            └──→ Automation pod 3
        
        Possible results include:

            - 3 sensor-reading insertions.
            - 3 executions of the same automation rules.
            - 3 HTTP requests to the light-control service.
            - Duplicate / Conflicting command-processing attempts.
    
        => Adding another MQTT-consuming replica, therefore, adds another subscriber & can multiply work instead of distributing existing work.

            - This differs from a competing-consumer / work-queue model.

                - In a competing-consumer / work-queue mode, multiple workers share a workload & one worker receives a particular delivery.
                - With ordinary MQTT subscriptions, every matching subscriber receives its own delivery.

#### Solutions

The appropriate MQTT organisation would use one shared-subscription group per service responsibility:

                Sensor-data replicas:
                    $share/sensor-storage/iot/sensors/+/+/+

                Automation replicas:
                    $share/automation/iot/sensors/+/+/+

    - For one publication, AWS IoT Core would select one member of the sensor-storage group & one memeber of the automation group.

    - The two service types ust not use the same shared-group name.

        - If they belonged to one group, they would compete with each other, and an event might be stored without being automated / automated without being stored.

    - Shared subscriptions distribute deliveries within a group, but, they do not guarantee exactly-once processing:

        - Retries, connection failures, or producer resubmission can still result in repeated delivery.

        - Stable event identifiers & idempotent consumers would therefore remain necessary.

### 4.4 State Ownership and Race Conditions

| State | Owner and storage location | Behaviour across replicas | Correctness risk |
|---|---|---|---|
| Sensor-reading history | Sensor-data service writes to MongoDB `sensorreadings` | All replicas share MongoDB, but ordinary MQTT subscriptions cause every replica to receive the same publication | The same logical reading can be inserted multiple times because no stable event identifier or uniqueness rule is evident |
| Current light state | Light-control service writes one `LightState` document identified by `lightId` | All light-control replicas query and update the shared collection | Concurrent requests can read the same previous state and independently conclude that a change is required |
| Command history | Light-control service inserts `LightCommand` documents | All replicas write to the same collection | Repeated or concurrent requests can create duplicate command-history entries |
| Automation rules | Each automation process stores its own `AUTOMATION_RULES` object | Rules are not automatically shared between replicas | Updating one pod through HTTP does not update the other pods, so replicas may make different decisions for identical readings |
| MQTT connection state | Each sensor-data and automation replica maintains its own client connection | Every replica connects directly to AWS IoT Core | Kubernetes HTTP load balancing does not distribute MQTT deliveries |
| API rate-limit counters | Each API gateway process uses its own rate limiter | Counters are local to an individual gateway replica | Requests distributed between gateway replicas may observe different limits |

#### Automation-rule inconsistentcy

The automation rules are created from environment variables when each process starts:

    LIGHT_THRESHOLD
    MOTION_TIMEOUT_MS

The PUT /api/automation/rules endpoint modifies only the in-memory object of the pod receiving that HTTP request.

    e.g:
            Automation pod A1 threshold = 200
            Automation pod A2 threshold = 200
            Automation pod A3 threshold = 200

        If an update request is routed to A2:

            Automation pod A1 threshold = 200
            Automation pod A2 threshold = 250
            Automation pod A3 threshold = 200
        
        Subsequent processing can depend on which replica receives the event. A pod restart also reconstructs the rules from environment variables & loses the runtime update.

        Although the automation service connects to MongoDB, the retained implementation does not persist / reload the automation rules from it.

#### Concurrent light-state update

The light-control endpoint performs separate operations:

    1. Read current LightState
    2. Decide whether the state changed
    3. Update LightState
    4. Insert LightCommand

These operations are not executed as one DB transaction.

Consider a light currently stored as "OFF" - 2 requests for "ON" arrive concurrently:

            Request R1 reads OFF
            Request R2 reads OFF

            R1 concludes OFF → ON
            R2 concludes OFF → ON

            R1 updates the state and records a command
            R2 updates the state and may record another command

    - The unique "lightId" protects MongoDB from maintaining 2 current-state documents for the same light.
        
        - However, it does not guarantee that only one command-history entry is produced.
    
    - There is also a partial-write risk:

            LightState update succeeds
                → LightCommand insertion fails
            
        - The light's current state then changes without a corresponding command-history record.

#### State-ownership Assessment

Compared with 6.3D, the current light state has moved from Node-RED's process-local cache into shared durable storage.

    - This is a meaningful improvement, because, replicas can obsever a common state & the state survives application restarts.

    - However, shared storage alone does not make concurrent processing correct.

        - The read, comparison, state update, & command insertion must be coordinated atomically, & repeated source events must be identifiable.


### 4.5 Kubernetes Scaling Analysis

| Service | CPU target | Memory target | Minimum replicas | Maximum replicas |
|---|---:|---:|---:|---:|
| Sensor-data service | 10% | 60% | 1 | 15 |
| Automation service | 35% | 60% | 2 | 10 |
| Light-control service | 15% | 60% | 1 | 8 |
| API gateway | 25% | 60% | 1 | 5 |

Kubernetes increases /  decreases replica counts according to average CPU / memory utilisation.

Deployments also define resource requests, limits, liveness probes, and readiness probes.

For HTTP-based traffic, additional replicas can increase availability & request-processing capacity because Kubernetes services distribute HTTP requests across ready pods:

    API gateway request

            → Kubernetes Service

                 → one selected service pod

For the MQTT-consuming services, the retained behavior is different:

    New pod:

        → Creates a new MQTT connection

        → Creates another ordinary subscription

        → Receives another copy of every matching publication

    => Consequently, additional sensor-data / automation replicas do not merely divide the MQTT workload. They can repeat it.

CPU-based autoscaling does not verify application correctness. It cannot determine whether:

    - The same sensor event was processed several times.
    - Multiple commands were created for one logical event.
    - 2 replicas made conflicting decisions.
    - Automation-rule configuration differs between replicas.
    - A state update & command insertion became partially commited.
    - MQTT throughput is being distributed / duplicated.

There is also a possible amplification effect:

        More incoming events

            → Higher CPU usage.

            → Kubernetes creates more MQTT subscribers.

            → Each event produces more processing attempts.

            → Downstream MongoDB & light-control load increases.

Horizontal scaling is, therefore, safe only after the message-distribution and state-consistency models are defined.

The required controls would include:

    1. Separate shared-subscription group for each replicated MQTT-consuming service
    2. Stable producer-generated event identifiers
    3. Idempotent persistence enforced by database uniques
    4. Atomatic coordination of current-state updates and commnad-history creation
    5. Tests proving that increasing replica count does not increase the number of business effects.

#### Scaling Conclusion

The 6.4HD architecture introduced valuable deployment capabilities, including container isolation, health probes, service discovery, load balancing, and horizontal autoscaling.

However, Kubernetes can restart and multiply application instances, it does not correct application-level delivery semantics, state races, or idempotency problems.

In the retained system, scaling the MQTT consumers can increase duplicate processing because each replica idependently subscribes to the same topic.

#### Principle Lesson

Replica count should affect system capacity & availability, not the number of logical sensor records / light commands produced from one event.

## 5. Comparison

| Concern | 6.3D | 6.4HD | Lesson |
|---|---|---|---|
| Event ingestion | Sensor simulators published JSON readings asynchronously through MQTT to AWS IoT Core. Node-RED subscribed to the sensor topics and acted as both the ingestion boundary and decision engine. The report describes a shared subscription, while the retained flows.json contains an ordinary subscription, leaving the exact deployed scaling behaviour uncertain. Explicit payload validation and stable event identifiers were not evident. | Sensor simulators continued to publish through MQTT to AWS IoT Core. AWS IoT Core fanned each event out to two independent subscriber types: the sensor-data service for persistence and the automation service for decision-making. This separation was valid, but every Kubernetes replica used an ordinary subscription, so adding replicas could multiply sensor inserts and automation executions. | Fan-out between different responsibilities is valid, but replicas of the same responsibility should distribute work rather than repeat it. Each replicated service type requires its own shared-subscription group. Incoming events should also use a validated contract and stable event identifier, while consumers must enforce idempotency because shared subscriptions do not eliminate every possible redelivery. |
| Business logic | Node-RED calculated the desired power and brightness from motion, light intensity, and time of day. It also performed state-change detection using its process-local global.lightStates cache. | The automation service calculated the desired ON or OFF state from the sensor reading. State-change detection was moved into the light-control service, which compared the desired state with the current state stored in MongoDB. | Decision calculation and state mutation should have explicit owners. Moving current state into shared durable storage improved restart and replica consistency, but concurrent state changes still require atomic coordination. |
| Persistence | Lambda created command-history and light-state-history records and wrote them sequentially to the DynamoDB `LightCommands` and `LightStates` tables. The two writes were not transactional, so the command write could succeed while the state write failed. Sensor readings were only retained when embedded in an emitted command; readings that caused no state change were not independently persisted. | The sensor-data service persisted received readings in MongoDB’s `sensorreadings` collection. The light-control service maintained a current `LightState` document and inserted `LightCommand` history records. This added complete sensor-reading storage and a durable current-state representation, but the state update and command insertion were still separate, non-transactional operations. Ordinary MQTT subscriptions could also cause several replicas to store the same reading. | Each persistent data type should have an explicit owner and purpose. Related changes that must remain consistent should be committed atomically. Persisted inputs require stable identifiers and uniqueness constraints so that retries or repeated deliveries do not create duplicate records. |
| State ownership | Node-RED owned the current calculated light state in its process-local `global.lightStates` map. This state was lost on restart and was not shared between Node-RED instances. DynamoDB stored durable state-history records, but Node-RED did not use them to recover or coordinate its decision state. | The light-control service owned current light state through the shared MongoDB `LightState` collection, allowing the state to survive restarts and be observed by different replicas. However, concurrent requests could perform conflicting read-check-update operations. Automation rules remained mutable process-local state in each automation pod, so rule updates could differ between replicas and disappear after restart. | Correctness-critical state requires one clearly defined source of truth. Replicas should use shared durable state or a deliberate partitioning strategy, and concurrent state changes must be coordinated atomically. Runtime configuration that affects decisions must also remain consistent across replicas. |
| Service communication | Sensor ingestion used asynchronous MQTT from the simulator through AWS IoT Core to Node-RED. Command execution used a synchronous dependency chain from Node-RED through AWS API Gateway and Lambda to DynamoDB. Node-RED updated its local state before knowing whether the downstream HTTP request and database writes succeeded. | Sensor events used asynchronous MQTT fan-out from AWS IoT Core to the sensor-data and automation services. The automation service then called the light-control service synchronously through HTTP. The custom Express API gateway provided a separate synchronous HTTP façade for external clients and was not part of automatic MQTT processing. Different entry points produced different effects: directly posting a sensor reading stored it but did not trigger automation. | Communication paths should document their delivery, waiting, retry, and failure semantics. Local state must not record success before required downstream effects succeed. Different entry points should provide consistent behaviour or clearly document why their workflows differ. |
| Duplicate handling | Node-RED suppressed unchanged commands by comparing a calculated state with its in-memory previous state. This was state-change detection rather than true duplicate-event handling. No stable source-event identifier or database uniqueness rule prevented the same logical event or retried HTTP command from being processed again. | The light-control service compared the desired state with the current MongoDB state and suppressed commands when the state appeared unchanged. However, sensor events lacked stable identifiers, sensor-reading persistence was not idempotent, and concurrent automation requests could both observe the same previous state and create repeated commands. | State-change detection and idempotency solve different problems. Every logical event should have a stable producer-generated identifier, while consumers should enforce database uniqueness and make repeated processing produce no additional business effect. |
| Scaling model | The architecture combined EC2-hosted Node-RED, load balancing and automatic instance scaling with managed Lambda scaling. However, Node-RED kept correctness-critical state inside each instance. The report described a shared MQTT subscription while the retained flow contained an ordinary subscription, so the exact deployed distribution behaviour cannot be verified. Increasing Node-RED instances could therefore divide or repeat work while instances held inconsistent state. | Kubernetes deployments, Services, health probes, and Horizontal Pod Autoscalers scaled the four services according to CPU and memory utilisation. Kubernetes Services distributed HTTP requests, but every sensor-data and automation replica independently subscribed to AWS IoT Core. Consequently, increasing MQTT-consuming replicas multiplied event processing instead of distributing it and increased concurrency against the shared MongoDB state. | Scaling infrastructure does not guarantee correct application behaviour. Replica count should increase capacity and availability without changing the number of business effects. Work distribution, state ownership, idempotency, ordering, and concurrency must be designed and tested before horizontal scaling is considered safe. |
| Operational complexity | The system depended on AWS IoT Core, certificates and policies, an EC2-hosted Node-RED deployment, API Gateway, Lambda, DynamoDB, load balancing, auto scaling, and monitoring configuration. Several important runtime artifacts existed only in the AWS account, so the system cannot now be fully inspected or reproduced after that account became unavailable. | The system moved more application logic into repository-managed Node.js services and containers, but introduced four separately deployed services, Docker images, Kubernetes Deployments and Services, HPAs, probes, secrets, certificates, inter-service HTTP communication, MongoDB, and AWS IoT Core. The services also shared one database while accepting the operational and failure complexity of a distributed system. | Architectural and operational complexity must be justified by concrete requirements. Infrastructure and runtime configuration should be reproducible from version-controlled artifacts. A small project should begin with the simplest architecture that preserves clear module boundaries, adding independent services or orchestration only when scaling, ownership, or deployment requirements justify them. |


## 6. Lessons for the Air-Conditioning Controller

| Legacy lesson | Keep, adapt, or reject? | Reason |
|---|---|---|
| MQTT sensor ingestion | | |
| Separate automation logic | | |
| Persistent command history | | |
| In-memory current state | | |
| Multiple independently deployed services | | |
| Kubernetes autoscaling | | |
| Idempotent event processing | | |

## 7. Conclusion

Summarise:

- what was learned from 6.3D;
- what 6.4HD changed;
- which problems remained or were introduced;
- which lessons should influence the new project.