# Stage 1 Foundation

## Setup the NestJS Backend Application

    node --version              = Check

    npm --version               = Check

    git status --short          = Check if the working tree is clean or not:

        If nothing is returned: Git found no modified, deleted, newly staged, or untracked files.

        It does not mean the repository has no files - just that the current files match the latest commit.

        Common short-status markers:

            M = Modified file
            A = Added / staged file
            D = Deleted file
            ?? = Untracked file

    Identify how Node was installed:
        where.exe node

## Creating a NestJS Application

    npx @nestjs/cli@latest new iot-aircon-control --directory . --package-manager npm --skip-git --no-observe --dry-run

        - "new iot-aircon-control": create a new NestJS application name "iot-aircon-control".

        - "--directory .": targets the current repository, instead of creating a nested folder.

                    Without this, Nest would create another directory like:

                            iot_aircon_control/
                                └── iot-aircon-control/

                    Vs. what we really want:

                            iot_aircon_control/
                                ├── documents/
                                ├── src/
                                ├── test/
                                └── package.json

        - "--package-manager npm": uses the package manager that already installed.

                Use "npm" to install & manage dependencies rather than asking whether we want npm, Yarn, pnpm, or Bun.

        - "--skip-git": preservers the existing GIT repository.

                Do not create a new Git repository - since the current folder does have an existing Git repo

        - "no-observe": do not configure NestJS;s external observability service.

        - "--dry-run": reports intended file changes without creating anything.

                Preview which project files the CLI intends to generate without actually generating them.

                The Nest CLI itself may be downloaded into npm's cache, but this repository should remain unchanged.

                Terminal Output Result:
                    PS C:\Users\Hayden Duong\Desktop\learning_projects\iot_aircon_control> npx @nestjs/cli@latest new iot-aircon-control --directory . --package-manager npm --skip-git --no-observe --dry-run

                        ✨  We will scaffold your app in a few seconds..

                        ✔ Which module system would you like to use? ESM (ES Modules)         [ with vitest ]
                        CREATE .oxlintrc.json (216 bytes)
                        CREATE .prettierrc (56 bytes)
                        CREATE nest-cli.json (179 bytes)
                        CREATE package.json (1486 bytes)
                        CREATE README.md (7105 bytes)
                        CREATE tsconfig.build.json (178 bytes)
                        CREATE tsconfig.json (624 bytes)
                        CREATE vitest.config.e2e.ts (256 bytes)
                        CREATE vitest.config.ts (363 bytes)
                        CREATE src/app.controller.ts (289 bytes)
                        CREATE src/app.module.ts (265 bytes)
                        CREATE src/app.service.ts (150 bytes)
                        CREATE src/main.ts (245 bytes)
                        CREATE src/app.controller.spec.ts (645 bytes)
                        CREATE test/app.e2e-spec.ts (760 bytes)
                        Dry run enabled. No files written to disk.


                        Command has been executed in dry run mode, nothing changed!


        Module Selected: "ESM"

            ESM (ES Modules)

                - Use standard JS syntax:

                    e.g:

                        // aircon-mode.ts
                        export function decideMode() {}

                        // app.ts
                        import { decideMode } from './aircon-mode.js';

                - Use this when:
                    - It is official JS module standard.
                    - Node 24 supports it natively & considers it stable.
                    - It is the current default for newly generated NestJS projects.
                    - Nest's ESM scaffold uses Vitest - its currently primary default for ESM testing.

            CJS (CommonJS)

                - Use Node's older module syntax:

                    e.g:

                        // aircon-mode.js
                        module.exports = { decideMode };

                        // app.js
                        const { decideMode } = require('./aircon-mode');

                - Use this when:
                    - Maintaing an existing CommonJS application.
                    - Depending on older libraries / tools with poor ESM compatibility.
                    - Matching a company's established project structure.
                    - Deliberately requiring Jest-based legacy tests.

    Once the "--dry-run" release the desired output: run the command again, but without "--dry-run" to actually installed the necessary files for NestJS application

## Pre-Coding Checks [This is useful dependency-management lesson: when a vulnerability comes through functionality we do not need => Deleting that functionality is often safer & simpler than forcing dependency upgrades]

        npm run build  (~ dotnet build) = Checks if TS and Nest can compile the project

            Checks compilation, type checking, module resolution, and Nest's build configuration.

        npm test  (~ dotnet test)  = Check is Vitest is installed & generated test passes.

            Checks that Vitest is configured correctly & that the generated behavior passes.

        npm run lint    = Static analysis finds no obvious code-quality / type-aware issues.

            Checks rules that compilation may not detect - e.g. suspicious patterns, unsused code, or consistency problems.

### Why we need these 3 tests right after creating the NestJS application?

    A newly generated application is expected to work, but "expected" is not evidence that it works on this machine.


    The generator has confirmed that it created files & installed packages, BUT, it has not yet proved that:

        - TypeScript can compile the generated configuration.

        - Node can resolve the ESM imports.

        - Vitest can discover & execute tests.

        - Oxlint works with the genrated TypeScript configuration.

        - Dependency installation completed without an incompatibility.


    The most important reason is establishing a know-good baseline:

        Generated application passes
                ↓
        We change something
                ↓
        A check fails
                ↓
        Our change probably caused it

    Without the baseline:

        We change something
                ↓
        A check fails
                ↓
        Was it our code, the scaffold, Node, ESM, or the test configuration?

### Encountering Vistest warning - This proves why we need to verify generated code rather than assuming it is perfect

        PS C:\Users\Hayden Duong\Desktop\learning_projects\iot_aircon_control> npm test

        > iot-aircon-control@0.0.1 test
        > vitest run

        The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.

    - Meaning:

        The tests work & we could leave it. However, the warning would appear on every test run later on.

    - Solution:

        Another checking (to make sure whether the warning above appear in it):

                npm run test:e2e  (end-to-end), this generate test by asking "npm" to execute the script named "test:e2e" from "package.json"

                    The current "package.json" contains: "test:e2e": "vitest run --config ./vitest.config.e2e.ts"

                    Therefore, "npm run test:e2e" expands to "vitest run --config ./vitest.config.e2e.ts"

                    What this test do:

                        1. Builds a Nest testing module using the complete "AppModule".
                        2. Initializes a Nest application in memory.
                        3. Sends an HTTP GET / request using Supertest.
                        4. Verifies HTTP status "200"
                        5. Verifies the response body is "Hello World!".
                        6. Closes the application after the test.

                It covers more wiring than the unit test: HTTP request → controller → service → HTTP response

        In "vitest.config.ts" & "vitest.config.e2e.ts":

            1. Remove "import tsconfigPaths from 'vite-tsconfig-paths;'

            2. Replace "plugins: [tsconfigPaths()]," with:

                resolve: {
                    tsconfigPaths: true,
                },

        Run: npm uninstall --save-dev vite-tsconfig-paths

            This will update both "package.json" & "package-lock.json"

            run these read-only reports:

                "npm audit"

                    terminal output:
                        PS C:\Users\Hayden Duong\Desktop\learning_projects\iot_aircon_control> npm audit
                        # npm audit report

                        tmp  <=0.2.5
                        Severity: high
                        tmp allows arbitrary temporary file / directory write via symbolic link `dir` parameter - https://github.com/advisories/GHSA-52f5-9888-hmc6
                        tmp has Path Traversal via unsanitized prefix/postfix that enables directory escape - https://github.com/advisories/GHSA-ph9p-34f9-6g65
                        fix available via `npm audit fix --force`
                        Will install @nestjs/mau@0.0.6, which is a breaking change
                        node_modules/tmp
                        external-editor  >=1.1.1
                        Depends on vulnerable versions of tmp
                        node_modules/external-editor
                            inquirer  3.0.0 - 8.2.6 || 9.0.0 - 9.3.7
                            Depends on vulnerable versions of external-editor
                            node_modules/inquirer
                            @nestjs/mau  *
                            Depends on vulnerable versions of inquirer
                            Depends on vulnerable versions of undici
                            node_modules/@nestjs/mau

                        undici  <=6.28.0
                        Severity: high
                        Use of Insufficiently Random Values in undici - https://github.com/advisories/GHSA-c76h-2ccp-4975
                        Undici has an unbounded decompression chain in HTTP responses on Node.js Fetch API via Content-Encoding leads to resource exhaustion - https://github.com/advisories/GHSA-g9mf-h72j-4rw9
                        undici Denial of Service attack via bad certificate data - https://github.com/advisories/GHSA-cxrh-j4jr-qwg3
                        Undici: Malicious WebSocket 64-bit length overflows parser and crashes the client - https://github.com/advisories/GHSA-f269-vfmq-vjvj
                        Undici has an HTTP Request/Response Smuggling issue - https://github.com/advisories/GHSA-2mjp-6q6p-2qxm
                        Undici has Unbounded Memory Consumption in WebSocket permessage-deflate Decompression - https://github.com/advisories/GHSA-vrm6-8vpv-qv8q
                        Undici has Unhandled Exception in WebSocket Client Due to Invalid server_max_window_bits Validation - https://github.com/advisories/GHSA-v9p9-hfj2-hcw8
                        Undici has CRLF Injection in undici via `upgrade` option - https://github.com/advisories/GHSA-4992-7rv2-5pvq
                        undici vulnerable to HTTP header injection via Set-Cookie percent-decoding - https://github.com/advisories/GHSA-p88m-4jfj-68fv
                        undici WebSocket client vulnerable to denial of service via fragment count bypass - https://github.com/advisories/GHSA-vxpw-j846-p89q
                        undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching - https://github.com/advisories/GHSA-g8m3-5g58-fq7m
                        undici vulnerable to downstream response desynchronization via retry interceptor - https://github.com/advisories/GHSA-8xcm-r25x-g524
                        undici vulnerable to CRLF Injection via blob-like body 'type' property - https://github.com/advisories/GHSA-m8rv-5g2x-5cg5
                        undici vulnerable to cookie attribute injection via unsanitized domain and unparsed setCookie fields - https://github.com/advisories/GHSA-v3r7-h72x-cjcm
                        undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse - https://github.com/advisories/GHSA-35p6-xmwp-9g52
                        undici vulnerable to downstream response splitting via retry interceptor - https://github.com/advisories/GHSA-r53p-7pc4-xj5r
                        undici vulnerable to Denial of Service via unrequested WebSocket subprotocol - https://github.com/advisories/GHSA-rfgv-xxqx-mfg5
                        fix available via `npm audit fix --force`
                        Will install @nestjs/mau@0.0.6, which is a breaking change
                        node_modules/undici

                        5 vulnerabilities (2 low, 1 moderate, 2 high)

                        To address all issues (including breaking changes), run:
                        npm audit fix --force

                "npm audit --omit=dev" (This command excludes development-only dependecies)

            Explanation:

                All 5 finding trace back to one direct development dependency:

                        @nestjs/mau
                            ├── inquirer
                            │   └── external-editor
                            │       └── tmp
                            └── undici

                @nestjs/mau is NestJS's AWS deployment platform - which is not belong to the current scope of this month-one stage => This dependency provides no current values

            Solution:

                Removing the unused root dependency and its script, by running:

                    "npm uninstall --save-dev @nestjs/mau"

                Then open "package.json" & remove the following script:

                    "deploy": "nest deploy",

                Then re-run both:

                    npm audit

                    npm audit --omit=dev

        Re-verify after running the above command with the followings:

            npm test

            npm run test:e2e

            npm run lint

            npm run build
