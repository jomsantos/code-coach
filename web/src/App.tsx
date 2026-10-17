import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, listExercises, requestHint, runExercise } from "./api";
import type { Exercise, HintResult, RunResult } from "./types";

type AsyncState = "idle" | "loading" | "success" | "error";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

export default function App() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseState, setExerciseState] = useState<AsyncState>("loading");
  const [exerciseError, setExerciseError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [code, setCode] = useState("");
  const [runState, setRunState] = useState<AsyncState>("idle");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState("");
  const [hintState, setHintState] = useState<AsyncState>("idle");
  const [hintResult, setHintResult] = useState<HintResult | null>(null);
  const [hintError, setHintError] = useState("");

  const selectedExercise = useMemo(
    () => exercises.find((item) => item.id === selectedId) ?? null,
    [exercises, selectedId],
  );
  const selectedPosition = Math.max(exercises.findIndex((item) => item.id === selectedId) + 1, 1);

  const loadExercises = useCallback(async () => {
    setExerciseState("loading");
    setExerciseError("");
    try {
      const loaded = await listExercises();
      setExercises(loaded);
      setExerciseState("success");
      const first = loaded[0];
      setSelectedId(first?.id ?? "");
      setCode(first?.starterCode ?? "");
    } catch (error) {
      setExerciseState("error");
      setExerciseError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    void loadExercises();
  }, [loadExercises]);

  function selectExercise(id: string) {
    const next = exercises.find((item) => item.id === id);
    if (!next) return;
    setSelectedId(next.id);
    setCode(next.starterCode);
    setRunState("idle");
    setRunResult(null);
    setRunError("");
    setHintState("idle");
    setHintResult(null);
    setHintError("");
  }

  async function runChecks() {
    if (!selectedExercise) return;
    setRunState("loading");
    setRunError("");
    setRunResult(null);
    try {
      setRunResult(await runExercise(selectedExercise.id, code));
      setRunState("success");
    } catch (error) {
      setRunError(errorMessage(error));
      setRunState("error");
    }
  }

  async function getHint() {
    if (!selectedExercise) return;
    setHintState("loading");
    setHintError("");
    setHintResult(null);
    try {
      setHintResult(await requestHint(selectedExercise.id, code));
      setHintState("success");
    } catch (error) {
      setHintError(errorMessage(error));
      setHintState("error");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="Code Coach home">
          <span className="brand-mark" aria-hidden="true">
            cc
          </span>
          <span className="brand-copy">
            <strong>code coach</strong>
            <small>learn by doing</small>
          </span>
        </a>
        <div className="topbar-right">
          <span className="language-pill">
            <span className="gleam-spark" aria-hidden="true">
              ✳
            </span>{" "}
            Learning Gleam
          </span>
          <span className="local-indicator">
            <span className="status-dot" aria-hidden="true" /> Local workspace
          </span>
          <button className="avatar" type="button" aria-label="Profile">
            J
          </button>
        </div>
      </header>

      <main id="main" className="learning-layout">
        <aside className="exercise-rail" aria-label="Exercise navigation">
          <div className="rail-heading">
            <div>
              <p className="eyebrow">YOUR LEARNING PATH</p>
              <h1>Gleam basics</h1>
            </div>
            <span className="progress-count">0 / {exercises.length}</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Learning progress"
            aria-valuenow={0}
            aria-valuemin={0}
            aria-valuemax={exercises.length}
          >
            <span />
          </div>
          <p className="section-label">
            START HERE <span>01—02</span>
          </p>
          {exerciseState === "loading" && (
            <div className="rail-message" role="status">
              Loading exercises…
            </div>
          )}
          {exerciseState === "error" && (
            <div className="rail-error" role="alert">
              <span className="error-symbol" aria-hidden="true">
                !
              </span>
              <span>{exerciseError}</span>
              <button className="text-button" type="button" onClick={() => void loadExercises()}>
                Try again
              </button>
            </div>
          )}
          {exerciseState === "success" && (
            <nav className="exercise-list" aria-label="Available exercises">
              {exercises.map((exercise, index) => (
                <button
                  key={exercise.id}
                  className={`exercise-nav-item${selectedId === exercise.id ? " active" : ""}`}
                  type="button"
                  aria-current={selectedId === exercise.id ? "step" : undefined}
                  onClick={() => selectExercise(exercise.id)}
                >
                  <span
                    className={`exercise-number${selectedId === exercise.id ? " selected" : ""}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="exercise-nav-copy">
                    <strong>{exercise.title}</strong>
                    <small>{exercise.topic}</small>
                  </span>
                  {selectedId === exercise.id && (
                    <span className="active-chevron" aria-hidden="true">
                      ›
                    </span>
                  )}
                </button>
              ))}
            </nav>
          )}
          <div className="rail-footer">
            <div className="streak-icon" aria-hidden="true">
              ✦
            </div>
            <div>
              <strong>A little progress adds up.</strong>
              <span>One small step today.</span>
            </div>
          </div>
        </aside>

        {selectedExercise && (
          <section className="work-area" aria-label="Exercise workspace">
            <div className="breadcrumb">
              <span>Gleam basics</span>
              <span aria-hidden="true">/</span>
              <strong>{selectedExercise.title}</strong>
            </div>
            <div className="exercise-heading">
              <div>
                <div className="exercise-meta">
                  <span className="topic-tag">{selectedExercise.topic}</span>
                  <span className="difficulty">
                    <span aria-hidden="true">◷</span> {selectedExercise.difficulty} · 5 min
                  </span>
                </div>
                <h2>
                  {selectedExercise.title}
                  <span className="title-period">.</span>
                </h2>
                <p className="objective">{selectedExercise.objective}</p>
              </div>
              <div className="step-badge">
                <span>YOUR EXERCISE</span>
                <strong>
                  {String(selectedPosition).padStart(2, "0")}{" "}
                  <i>/ {String(exercises.length).padStart(2, "0")}</i>
                </strong>
              </div>
            </div>

            <div className="instruction-card">
              <div className="instruction-icon" aria-hidden="true">
                <span>✳</span>
              </div>
              <div>
                <p className="card-kicker">THE CHALLENGE</p>
                <p>{selectedExercise.instructions}</p>
              </div>
            </div>

            <div className="editor-heading">
              <div>
                <span className="editor-dot" aria-hidden="true" />
                <strong>Your solution</strong>
                <span className="file-label">solution.gleam</span>
              </div>
              <button
                className="reset-button"
                type="button"
                onClick={() => setCode(selectedExercise.starterCode)}
              >
                <span aria-hidden="true">↺</span> Reset starter
              </button>
            </div>
            <div className="editor-frame">
              <div className="editor-gutter" aria-hidden="true">
                {code
                  .split("\n")
                  .map((_, index) => index + 1)
                  .join("\n")}
              </div>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                aria-label="Your Gleam solution"
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
              />
              <div className="editor-language">
                GLEAM <span>UTF-8</span>
              </div>
            </div>
            <div className="editor-actions">
              <p>
                <span className="local-lock" aria-hidden="true">
                  ▣
                </span>{" "}
                Your code stays on this device
              </p>
              <button
                className="run-button"
                type="button"
                disabled={runState === "loading"}
                onClick={() => void runChecks()}
              >
                <span aria-hidden="true">
                  {runState === "loading" ? <i className="spinner" /> : "▶"}
                </span>
                {runState === "loading" ? "Checking…" : "Run checks"}
                <kbd>⌘ ↵</kbd>
              </button>
            </div>

            {runState === "success" && runResult && (
              <section
                className={`result-panel ${runResult.passed ? "passed" : "failed"}`}
                aria-live="polite"
                role="status"
              >
                <span className="result-icon" aria-hidden="true">
                  {runResult.passed ? "✓" : "↻"}
                </span>
                <div>
                  <strong>{runResult.summary}</strong>
                  <pre>{runResult.output}</pre>
                </div>
                <span className="result-label">
                  {runResult.passed ? "NICE WORK" : "KEEP GOING"}
                </span>
              </section>
            )}
            {runState === "error" && (
              <section className="result-panel service-error" role="alert">
                <span className="result-icon" aria-hidden="true">
                  !
                </span>
                <div>
                  <strong>Couldn’t run the checks</strong>
                  <p>{runError}</p>
                </div>
                <button className="retry-button" type="button" onClick={() => void runChecks()}>
                  Try again
                </button>
              </section>
            )}
          </section>
        )}

        <aside className="coach-panel" aria-label="Coach help">
          <div className="coach-title-row">
            <div className="coach-avatar" aria-hidden="true">
              <span>✳</span>
            </div>
            <div>
              <p className="eyebrow">YOUR COACH</p>
              <h2>Stuck? That’s okay.</h2>
            </div>
          </div>
          <p className="coach-intro">
            Learning happens one small insight at a time. Try a hint when you need a nudge.
          </p>
          <div className="example-card">
            <div className="example-header">
              <span className="example-icon" aria-hidden="true">
                ⌘
              </span>
              <span>A QUICK EXAMPLE</span>
            </div>
            <p>Here’s what the result could look like:</p>
            <code>{selectedExercise?.example ?? 'greeting() // "Hello, Gleam!"'}</code>
          </div>
          <div className="hint-card">
            <div className="hint-heading">
              <span className="hint-bulb" aria-hidden="true">
                ✧
              </span>
              <div>
                <strong>A gentle hint</strong>
                <small>No spoilers, just a nudge</small>
              </div>
            </div>
            {hintState === "success" && hintResult ? (
              <p className="hint-answer" role="status">
                {hintResult.hint}
              </p>
            ) : hintState === "error" ? (
              <p className="hint-error" role="alert">
                {hintError}
              </p>
            ) : hintState === "loading" ? (
              <p className="hint-wait" role="status">
                <span className="spinner light" aria-hidden="true" /> Thinking of a nudge…
              </p>
            ) : (
              <p className="hint-placeholder">
                Not sure where to start? You can ask for a small clue whenever you need one.
              </p>
            )}
            <button
              className="hint-button"
              type="button"
              disabled={hintState === "loading" || !selectedExercise}
              onClick={() => void getHint()}
            >
              <span aria-hidden="true">✧</span>
              {hintState === "error"
                ? "Try again"
                : hintState === "success"
                  ? "Another hint"
                  : "Give me a hint"}
              <span className="button-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          </div>
          <div className="gentle-note">
            <span aria-hidden="true">♡</span> No rush. Take your time.
          </div>
        </aside>
      </main>
      <footer className="page-footer">
        <span>Made for curious minds.</span>
        <span>
          Local prototype <i>·</i> Gleam
        </span>
      </footer>
    </div>
  );
}
