# Code Coach

Code Coach is a local-first app for learning Gleam through small coding exercises. The interface is built with React and TypeScript, with a Rust service handling exercise data and local actions. A later milestone will connect real Gleam execution and a local Ollama model.

## Project status

Milestone 1 is in progress. It is a UI-first vertical slice backed by a local Rust service. Exercise runs and hints are simulated; this prototype does not execute Gleam or call Ollama.

- [Project roadmap](docs/ROADMAP.md)
- [Milestone 1 plan](docs/milestone-1-plan.md)

## First milestone

Milestone 1 is a thin, reviewable vertical slice: a React/TypeScript interface backed by a small Rust local service. It uses sample exercises and simulated run and hint responses. Real compiler execution, Ollama integration, and saved progress are planned for later milestones.

## Development setup

Install [mise](https://mise.jdx.dev/) and trust the project configuration. It pins Node.js 24 LTS and Rust 1.99.1 in `.tool-versions`, and installs the Rust coverage and mutation tools from `mise.toml`:

```sh
mise trust
mise install
mise run setup
```

`mise run setup` installs the locked npm dependencies and Playwright's Chromium browser. For Linux, install the browser's system packages with `npx playwright install --with-deps chromium`.

Start the Rust service and React app in separate terminals:

```sh
mise run dev-api
```

```sh
mise run dev-web
```

The UI is served at `http://localhost:5173`; the Rust API listens at `http://127.0.0.1:3000`.

Run `mise tasks ls` to see the available project commands.

## Verification

Run the full verification sequence, including unit tests, coverage, browser tests, and mutation tests:

```sh
mise run verify
```

Individual tasks are available when you want a narrower check:

```sh
mise run format
mise run lint-web
mise run test-rust
mise run test-web
mise run test-e2e
mise run coverage-rust
mise run mutation-rust
mise run mutation-web
```

The web code uses Biome for linting and formatting, React 19, and TypeScript. Direct web dependencies are pinned to stable versions in `web/package.json` and `web/package-lock.json`.

## Local API

The service contract is documented in [docs/API.md](docs/API.md).

## Testing goals

The project aims for useful unit coverage in Rust and React/TypeScript, browser end-to-end coverage of the learner flow, and mutation testing on core logic where practical. See the [Milestone 1 testing strategy](docs/milestone-1-plan.md#testing-strategy).
