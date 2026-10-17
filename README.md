# Code Coach

Code Coach is a local-first app for learning Gleam through small coding exercises. The planned interface is built with Vue and TypeScript, with a Rust service handling exercise data and local actions. A later milestone will connect real Gleam execution and a local Ollama model.

## Project status

This repository currently contains the product roadmap and the plan for the first milestone. Application implementation has not started yet.

- [Project roadmap](docs/ROADMAP.md)
- [Milestone 1 plan](docs/milestone-1-plan.md)

## First milestone

Milestone 1 is a thin, reviewable vertical slice: a Vue/TypeScript interface backed by a small Rust local service. It uses sample exercises and simulated run and hint responses. Real compiler execution, Ollama integration, and saved progress are planned for later milestones.

## Planned development setup

The specific frontend and Rust tooling will be selected during Milestone 1 implementation. Once established, this section will document prerequisites and the commands to run the app, service, and test suites.

## Testing goals

The project aims for useful unit coverage in Rust and Vue/TypeScript, browser end-to-end coverage of the learner flow, and mutation testing on core logic where practical. See the [Milestone 1 testing strategy](docs/milestone-1-plan.md#testing-strategy).
