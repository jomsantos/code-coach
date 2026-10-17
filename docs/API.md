# Local API contract

The Milestone 1 service listens on `127.0.0.1:3000` by default. Set `CODE_COACH_PORT` to choose another port. The browser client reads `VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:3000`.

All endpoints are prefixed by `/api/v1`. JSON responses use camelCase field names. Requests that need learner code use `Content-Type: application/json`.

## `GET /api/v1/exercises`

Returns the available sample exercises:

```json
[
  {
    "id": "hello-world",
    "title": "Say hello",
    "objective": "Build confidence with a small Gleam function.",
    "instructions": "Write a function that returns the greeting shown in the example.",
    "topic": "Functions",
    "difficulty": "Beginner",
    "starterCode": "pub fn greeting() -> String {\n  \"\"\n}",
    "example": "greeting() // \"Hello, Gleam!\""
  }
]
```

## `GET /api/v1/exercises/{id}`

Returns one exercise in the same shape, or `404` with `{ "error": "That exercise could not be found." }` for an unknown ID.

## `POST /api/v1/exercises/{id}/run`

Request:

```json
{ "code": "pub fn greeting() -> String { \"Hello, Gleam!\" }" }
```

Response:

```json
{
  "passed": true,
  "summary": "All checks passed",
  "output": "✓ Example check passed: greeting() // \"Hello, Gleam!\""
}
```

The milestone prototype uses deterministic mock checks. `hello-world` passes when the code contains `Hello, Gleam!`; `add-two` passes when it contains `a + b`. This is illustrative only and does not compile or execute learner code.

## `POST /api/v1/exercises/{id}/hint`

Request:

```json
{ "code": "pub fn greeting() -> String { \"\" }" }
```

Response:

```json
{ "hint": "A Gleam string is written between double quotes. Return the greeting as a string from your function." }
```

Hints are fixed per exercise in Milestone 1; no model is called.

## Errors

- Empty or whitespace-only `code` returns `400` and `{ "error": "Enter some code before continuing." }`.
- Unknown exercise IDs return `404` and `{ "error": "That exercise could not be found." }`.
- The UI reports network and other HTTP errors and lets the learner retry.

The service accepts browser requests from the local Vite origins `http://127.0.0.1:5173` and `http://localhost:5173`.
