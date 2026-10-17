# Milestone 1 plan: clickable interface prototype

## Goal

Create a polished, clickable Vue and TypeScript prototype backed by a small Rust local service. This is the first thin vertical slice: exercise selection, editing, simulated test runs, and simulated hints work through the UI and service. Real Gleam execution and Ollama integration remain future milestones.

## Learner flow

1. Open the app and see the available exercises.
2. Select an exercise and read its instructions and example.
3. Edit a starter solution in the code area.
4. Select **Run** and see a simulated passing or failing test result returned by Rust.
5. Select **Get a hint** and see a simulated, exercise-aware hint returned by Rust.
6. Switch exercises and see the selected exercise reflected throughout the page.

## Interface scope

- **App shell:** product name, compact navigation, and a clear local-app identity.
- **Exercise list:** a small sample set, selection state, and simple topic or difficulty metadata.
- **Exercise detail:** title, learning objective, instructions, and starter-code context.
- **Code area:** editable monospace input with a visible language label and a reset-to-starter action. Use a lightweight editor component if one is already available; otherwise use a styled textarea so the prototype stays easy to run.
- **Run feedback:** idle, running, passed, and failed states with representative test output.
- **Coaching panel:** hint action, loading state, sample response, and a recoverable error state.
- **Responsive layout:** usable on a typical laptop viewport and a narrower window; keep the exercise picker accessible when the main content stacks.

## Rust service and mock-data behavior

- Keep sample exercise data in a typed Rust module, separate from HTTP handlers.
- Expose a small, documented local HTTP API for listing/getting exercises, simulated runs, and simulated hints. Keep request and response shapes explicit and versionable.
- Make exercise selection, code editing, reset, run, and hint actions call the service locally.
- Provide deterministic sample success, failure, and service-error outcomes; use short delays only where needed to review UI loading states.
- Keep service interfaces replaceable so later milestones can swap in Gleam execution and Ollama without redesigning the UI flow.
- Use accessible labels, visible keyboard focus, and semantic buttons and headings.

## Testing strategy

- **Rust unit tests:** cover exercise lookup and validation, run-result selection, hint behavior, request validation, and error mapping. Include both expected results and invalid or missing input cases.
- **Frontend unit/component tests:** cover exercise selection, editor reset, loading/result/error rendering, and the main user actions using mocked HTTP responses.
- **End-to-end tests:** start the real Rust service and frontend, then drive a browser through selecting an exercise, editing code, running a simulated pass and failure, requesting a hint, and recovering from a service error.
- **Contract checks:** verify frontend request/response assumptions against the service API, preferably through end-to-end tests or shared fixtures generated from the API schema.
- **Coverage review:** report Rust and frontend coverage and inspect uncovered decision branches on core behavior. Prefer meaningful branch coverage over a percentage target that encourages low-value tests.
- **Mutation testing:** try `cargo-mutants` on Rust core logic and a TypeScript/Vue-compatible mutation runner on focused frontend logic. Keep mutation scope small enough for practical feedback; review surviving mutants and document any excluded/generated code. If a suitable Vue-compatible tool is not reliable, keep mutation testing on Rust and record the frontend limitation.
- Run unit and end-to-end suites in CI or the repository's standard verification workflow once established.

## Out of scope

- Persistence and accounts.
- Running Gleam code or invoking a real compiler.
- Calling Ollama or generating real hints.
- Full editor features such as language-server completion or syntax diagnostics.
- Additional programming languages.

## Acceptance criteria

- A reviewer can complete the full sample flow with the local Rust service and without external services.
- At least two sample exercises can be selected, each with distinct instructions and starter code.
- The code field is editable and reset restores the selected exercise's starter code.
- Run and hint actions visibly transition through loading and result states.
- Pass, fail, and recoverable error states are represented in the UI.
- Rust unit tests and frontend component tests cover core logic and key UI states; browser end-to-end tests exercise the complete UI-to-Rust flow.
- Coverage is reviewed for core decision paths, and mutation testing is run on suitable Rust and frontend logic or its limitations are documented.
- The layout remains usable at laptop and narrow viewport sizes.
- The app and Rust service can be started using the repository's documented development commands.

## Implementation sequence

1. Inspect the repository and establish Vue/TypeScript, Rust, and build-tool baselines if they do not exist.
2. Agree on the minimal local API contract and implement Rust sample exercise data and handlers with unit tests.
3. Implement the page shell and exercise selection, connecting the UI to the service.
4. Add editor state and reset, then simulated run results and output presentation.
5. Add simulated hints, loading/error handling, and browser end-to-end coverage across the complete flow.
6. Review coverage and mutation-test results, then review visual consistency, accessibility basics, and narrow-window behavior.
7. Document how to start the app and service, run the test suites, and where real Gleam/Ollama behavior will replace simulation.

## Decisions to revisit during review

- Whether the editor should be a textarea for the first prototype or a dedicated editor package.
- The smallest Rust web framework and frontend test stack that fit the repository and support reliable end-to-end and mutation testing.
- The visual direction and amount of guidance shown beside the code.
- Whether the first exercise picker is a sidebar or a separate selection screen.
- The sample exercise content and the best default simulated outcomes.
