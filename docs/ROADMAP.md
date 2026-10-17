# Code Coach roadmap

The Code Coach is a local-first app for learning Gleam. Its interface comes first, and each milestone adds a complete user-facing vertical slice. Milestone 1 includes both the Vue and TypeScript interface and a small Rust local service, using mock exercise and coaching behavior. Later slices add real Gleam execution, Ollama, and persistence.

## Milestones

### 1. Clickable interface prototype

Build the Vue and TypeScript app shell and a minimal Rust local service. Include an exercise list, selected exercise view, prompt, code editor area, test output, and hint panel, plus loading and error states. The Rust service serves mock exercises and deterministic simulated run and hint responses; the UI calls it end to end.

**Complete when:** a learner can use the intended coaching flow through the UI and Rust service, and the service behavior is covered by unit tests and browser end-to-end tests.

### 2. Solve one exercise

Replace the simulated run behavior with real Gleam execution for one exercise. Show compiler and test results in the existing interface. Keep Ollama hints as a placeholder.

**Complete when:** a learner can finish one exercise from the interface and see a real test result.

### Testing foundation (part of Milestone 1 and ongoing)

Establish fast unit tests for Rust behavior and Vue/TypeScript components, plus browser end-to-end coverage for the main learner flows. Add mutation testing where the chosen Rust and frontend tooling supports the stack reliably. Keep tests focused on observable behavior and error paths, and run the relevant suites as each vertical slice is added.

**Complete when:** the primary exercise-selection, run, hint, loading, and error paths have automated coverage at their appropriate levels, with mutation testing exercised on core logic where practical.

### 3. Ask for a hint

Add a hint action that sends the exercise and learner's code from Rust to a local Ollama model. Display the response and useful errors when Ollama is unavailable.

**Complete when:** a learner can request a context-aware hint from the interface.

### 4. Exercise library

Load multiple exercises from files, show topic and difficulty, and let the learner select another exercise. Explain malformed exercise data clearly.

**Complete when:** learners can choose from several exercises without changing application code.

### 5. Saved progress

Persist attempts and completions locally. Show progress in the exercise list and a simple history view, and retain it across restarts.

**Complete when:** the learner can leave and return without losing their work or progress.

### 6. Coaching improvements

Add distinct actions for explaining an error and giving a hint. Add a similar-example action once the basic coaching flow is useful. Refine prompts and presentation based on use.

**Complete when:** learners can choose the kind of help they need and get relevant responses.

### 7. Polish and extensibility

Add Ollama model and service settings, improve setup instructions and error handling, and make it straightforward to add exercises. Consider another learning language after the Gleam workflow is solid.

**Complete when:** a new learner can set up and use the app without understanding its internals.

## Working approach

- Keep the UI-first direction: prototype and review the interface before implementing the core backend.
- Build each milestone as a vertical slice that can be used and reviewed on its own.
- Keep the first release focused on Gleam and local use.
- Revisit and update this roadmap as we learn from each milestone.
