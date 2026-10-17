import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const exercises = [
  {
    id: "hello-world",
    title: "Say hello",
    objective: "Build a small function.",
    instructions: "Return a greeting.",
    topic: "Functions",
    difficulty: "Beginner",
    starterCode: 'pub fn greeting() -> String {\n  ""\n}',
    example: 'greeting() // "Hello, Gleam!"',
  },
  {
    id: "add-two",
    title: "Add two numbers",
    objective: "Practice integer arithmetic.",
    instructions: "Return the sum of both values.",
    topic: "Integers",
    difficulty: "Beginner",
    starterCode: "pub fn add_two(a: Int, b: Int) -> Int {\n  0\n}",
    example: "add_two(20, 22) // 42",
  },
];

function mockResponse(payload: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => payload } as Response;
}

function installApiMock(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("learner workspace", () => {
  it("loads exercises, selects another exercise, and resets its code", async () => {
    const fetchMock = installApiMock((url) =>
      mockResponse(url.endsWith("/exercises") ? exercises : {}),
    );
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Say hello." })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Add two numbers/ }));
    const editor = screen.getByRole("textbox", {
      name: "Your Gleam solution",
    }) as HTMLTextAreaElement;
    expect(editor.value).toContain("add_two");
    fireEvent.change(editor, { target: { value: "broken code" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset starter/ }));
    expect(editor.value).toContain("  0");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows successful and failing simulated runs from the service", async () => {
    let call = 0;
    installApiMock((url) => {
      if (url.endsWith("/exercises")) return mockResponse(exercises);
      call += 1;
      return mockResponse({
        passed: call === 1,
        summary: call === 1 ? "All checks passed" : "One check still needs work",
        output: "Example check",
      });
    });
    render(<App />);
    const runButton = await screen.findByRole("button", { name: /Run checks/ });
    fireEvent.click(runButton);
    expect(await screen.findByText("All checks passed")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Run checks/ }));
    expect(await screen.findByText("One check still needs work")).toBeTruthy();
  });

  it("keeps the loading state visible while a run is pending", async () => {
    let finishRun: ((response: Response) => void) | undefined;
    installApiMock((url) =>
      url.endsWith("/exercises")
        ? mockResponse(exercises)
        : new Promise((resolve) => {
            finishRun = resolve;
          }),
    );
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Run checks/ }));
    expect(screen.getByText("Checking…")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Checking/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    finishRun?.(mockResponse({ passed: true, summary: "All checks passed", output: "passed" }));
    expect(await screen.findByText("All checks passed")).toBeTruthy();
  });

  it("displays a context hint and allows retry after an error", async () => {
    let hintCalls = 0;
    installApiMock((url) => {
      if (url.endsWith("/exercises")) return mockResponse(exercises);
      hintCalls += 1;
      return hintCalls === 1
        ? mockResponse({ error: "The coach is temporarily unavailable." }, 503)
        : mockResponse({ hint: "Try returning a string value." });
    });
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Give me a hint/ }));
    expect(await screen.findByText(/temporarily unavailable/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    expect(await screen.findByText("Try returning a string value.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Add two numbers/ }));
    await waitFor(() => expect(screen.queryByText("Try returning a string value.")).toBeNull());
    expect(
      (screen.getByRole("textbox", { name: "Your Gleam solution" }) as HTMLTextAreaElement).value,
    ).toContain("add_two");
  });

  it("offers a retry when the service is unavailable during startup", async () => {
    let attempts = 0;
    installApiMock(() => {
      attempts += 1;
      return attempts === 1 ? mockResponse({ error: "offline" }, 503) : mockResponse(exercises);
    });
    render(<App />);
    expect(await screen.findByText("offline")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    expect(await screen.findByRole("heading", { name: "Say hello." })).toBeTruthy();
  });
});
