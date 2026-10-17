@/Users/jomsantos/.codex/RTK.md

# Repository guidance

- Read `README.md` and the relevant files in `docs/` before changing the project direction or adding a milestone's functionality.
- Keep work aligned with the current milestone and implement user-facing vertical slices.
- Keep the Vue/TypeScript interface and Rust service boundaries explicit. Treat the Rust service API as a contract consumed by the UI.
- Add and maintain focused unit tests for Rust and frontend behavior, plus browser end-to-end tests for complete learner flows.
- Review coverage of important branches. Use mutation testing on suitable core logic when the configured tooling supports it, and document practical limitations.
- Keep setup, development, and verification commands documented in `README.md` as they become known.
- Do not claim tests or checks passed unless they were run and their results were inspected.
