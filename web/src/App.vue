<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ApiError, listExercises, requestHint, runExercise } from './api'
import type { Exercise, HintResult, RunResult } from './types'

type AsyncState = 'idle' | 'loading' | 'success' | 'error'

const exercises = ref<Exercise[]>([])
const exerciseState = ref<AsyncState>('loading')
const exerciseError = ref('')
const selectedId = ref('')
const code = ref('')
const runState = ref<AsyncState>('idle')
const runResult = ref<RunResult | null>(null)
const runError = ref('')
const hintState = ref<AsyncState>('idle')
const hintResult = ref<HintResult | null>(null)
const hintError = ref('')

const selectedExercise = computed(
  () => exercises.value.find((item) => item.id === selectedId.value) ?? null,
)
const selectedPosition = computed(() =>
  Math.max(exercises.value.findIndex((item) => item.id === selectedId.value) + 1, 1),
)
const runTone = computed(() => (runResult.value?.passed ? 'passed' : 'failed'))

onMounted(loadExercises)

async function loadExercises() {
  exerciseState.value = 'loading'
  exerciseError.value = ''
  try {
    exercises.value = await listExercises()
    exerciseState.value = 'success'
    selectExercise(exercises.value[0]?.id ?? '')
  } catch (error) {
    exerciseState.value = 'error'
    exerciseError.value = errorMessage(error)
  }
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
}

function selectExercise(id: string) {
  const next = exercises.value.find((item) => item.id === id)
  if (!next) return
  selectedId.value = next.id
  code.value = next.starterCode
  runState.value = 'idle'
  runResult.value = null
  runError.value = ''
  hintState.value = 'idle'
  hintResult.value = null
  hintError.value = ''
}

function resetCode() {
  if (selectedExercise.value) code.value = selectedExercise.value.starterCode
}

async function runChecks() {
  if (!selectedExercise.value) return
  runState.value = 'loading'
  runError.value = ''
  runResult.value = null
  try {
    runResult.value = await runExercise(selectedExercise.value.id, code.value)
    runState.value = 'success'
  } catch (error) {
    runError.value = errorMessage(error)
    runState.value = 'error'
  }
}

async function getHint() {
  if (!selectedExercise.value) return
  hintState.value = 'loading'
  hintError.value = ''
  hintResult.value = null
  try {
    hintResult.value = await requestHint(selectedExercise.value.id, code.value)
    hintState.value = 'success'
  } catch (error) {
    hintError.value = errorMessage(error)
    hintState.value = 'error'
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#main" aria-label="Code Coach home">
        <span class="brand-mark" aria-hidden="true">cc</span>
        <span class="brand-copy"><strong>code coach</strong><small>learn by doing</small></span>
      </a>
      <div class="topbar-right">
        <span class="language-pill"
          ><span class="gleam-spark" aria-hidden="true">✳</span> Learning Gleam</span
        >
        <span class="local-indicator"
          ><span class="status-dot" aria-hidden="true"></span> Local workspace</span
        >
        <button class="avatar" type="button" aria-label="Profile">J</button>
      </div>
    </header>

    <main id="main" class="learning-layout">
      <aside class="exercise-rail" aria-label="Exercise navigation">
        <div class="rail-heading">
          <div>
            <p class="eyebrow">YOUR LEARNING PATH</p>
            <h1>Gleam basics</h1>
          </div>
          <span class="progress-count">0 / {{ exercises.length }}</span>
        </div>
        <div class="progress-track" aria-label="0 percent complete"><span></span></div>

        <p class="section-label">START HERE <span>01—02</span></p>
        <div v-if="exerciseState === 'loading'" class="rail-message" role="status">
          Loading exercises…
        </div>
        <div v-else-if="exerciseState === 'error'" class="rail-error" role="alert">
          <span class="error-symbol" aria-hidden="true">!</span>
          <span>{{ exerciseError }}</span>
          <button class="text-button" type="button" @click="loadExercises">Try again</button>
        </div>
        <nav v-else class="exercise-list" aria-label="Available exercises">
          <button
            v-for="(exercise, index) in exercises"
            :key="exercise.id"
            class="exercise-nav-item"
            :class="{ active: selectedId === exercise.id }"
            type="button"
            :aria-current="selectedId === exercise.id ? 'step' : undefined"
            @click="selectExercise(exercise.id)"
          >
            <span class="exercise-number" :class="{ selected: selectedId === exercise.id }">{{
              String(index + 1).padStart(2, '0')
            }}</span>
            <span class="exercise-nav-copy">
              <strong>{{ exercise.title }}</strong>
              <small>{{ exercise.topic }}</small>
            </span>
            <span v-if="selectedId === exercise.id" class="active-chevron" aria-hidden="true"
              >›</span
            >
          </button>
        </nav>

        <div class="rail-footer">
          <div class="streak-icon" aria-hidden="true">✦</div>
          <div><strong>A little progress adds up.</strong><span>One small step today.</span></div>
        </div>
      </aside>

      <section v-if="selectedExercise" class="work-area" aria-label="Exercise workspace">
        <div class="breadcrumb">
          <span>Gleam basics</span><span aria-hidden="true">/</span
          ><strong>{{ selectedExercise.title }}</strong>
        </div>
        <div class="exercise-heading">
          <div>
            <div class="exercise-meta">
              <span class="topic-tag">{{ selectedExercise.topic }}</span
              ><span class="difficulty"
                ><span aria-hidden="true">◷</span> {{ selectedExercise.difficulty }} · 5 min</span
              >
            </div>
            <h2>{{ selectedExercise.title }}<span class="title-period">.</span></h2>
            <p class="objective">{{ selectedExercise.objective }}</p>
          </div>
          <div class="step-badge">
            <span>YOUR EXERCISE</span
            ><strong
              >{{ String(selectedPosition).padStart(2, '0') }}
              <i>/ {{ String(exercises.length).padStart(2, '0') }}</i></strong
            >
          </div>
        </div>

        <div class="instruction-card">
          <div class="instruction-icon" aria-hidden="true"><span>✳</span></div>
          <div>
            <p class="card-kicker">THE CHALLENGE</p>
            <p>{{ selectedExercise.instructions }}</p>
          </div>
        </div>

        <div class="editor-heading">
          <div>
            <span class="editor-dot" aria-hidden="true"></span><strong>Your solution</strong
            ><span class="file-label">solution.gleam</span>
          </div>
          <button class="reset-button" type="button" @click="resetCode">
            <span aria-hidden="true">↺</span> Reset starter
          </button>
        </div>
        <div class="editor-frame">
          <div class="editor-gutter" aria-hidden="true">
            {{
              code
                .split('\n')
                .map((_, index) => index + 1)
                .join('\n')
            }}
          </div>
          <textarea
            v-model="code"
            aria-label="Your Gleam solution"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
          />
          <div class="editor-language">GLEAM <span>UTF-8</span></div>
        </div>

        <div class="editor-actions">
          <p><span class="local-lock" aria-hidden="true">▣</span> Your code stays on this device</p>
          <button
            class="run-button"
            type="button"
            :disabled="runState === 'loading'"
            @click="runChecks"
          >
            <span v-if="runState === 'loading'" class="spinner" aria-hidden="true"></span>
            <span v-else aria-hidden="true">▶</span>
            {{ runState === 'loading' ? 'Checking…' : 'Run checks' }}
            <kbd>⌘ ↵</kbd>
          </button>
        </div>

        <section
          v-if="runState === 'success' && runResult"
          class="result-panel"
          :class="runTone"
          aria-live="polite"
          role="status"
        >
          <span class="result-icon" aria-hidden="true">{{ runResult.passed ? '✓' : '↻' }}</span>
          <div>
            <strong>{{ runResult.summary }}</strong>
            <pre>{{ runResult.output }}</pre>
          </div>
          <span class="result-label">{{ runResult.passed ? 'NICE WORK' : 'KEEP GOING' }}</span>
        </section>
        <section v-else-if="runState === 'error'" class="result-panel service-error" role="alert">
          <span class="result-icon" aria-hidden="true">!</span>
          <div>
            <strong>Couldn’t run the checks</strong>
            <p>{{ runError }}</p>
          </div>
          <button class="retry-button" type="button" @click="runChecks">Try again</button>
        </section>
      </section>

      <aside class="coach-panel" aria-label="Coach help">
        <div class="coach-title-row">
          <div class="coach-avatar" aria-hidden="true"><span>✳</span></div>
          <div>
            <p class="eyebrow">YOUR COACH</p>
            <h2>Stuck? That’s okay.</h2>
          </div>
        </div>
        <p class="coach-intro">
          Learning happens one small insight at a time. Try a hint when you need a nudge.
        </p>

        <div class="example-card">
          <div class="example-header">
            <span class="example-icon" aria-hidden="true">⌘</span><span>A QUICK EXAMPLE</span>
          </div>
          <p>Here’s what the result could look like:</p>
          <code>{{ selectedExercise?.example ?? 'greeting() // "Hello, Gleam!"' }}</code>
        </div>

        <div class="hint-card">
          <div class="hint-heading">
            <span class="hint-bulb" aria-hidden="true">✧</span>
            <div><strong>A gentle hint</strong><small>No spoilers, just a nudge</small></div>
          </div>
          <p v-if="hintState === 'success' && hintResult" class="hint-answer" role="status">
            {{ hintResult.hint }}
          </p>
          <p v-else-if="hintState === 'error'" class="hint-error" role="alert">{{ hintError }}</p>
          <p v-else-if="hintState === 'loading'" class="hint-wait" role="status">
            <span class="spinner light" aria-hidden="true"></span> Thinking of a nudge…
          </p>
          <p v-else class="hint-placeholder">
            Not sure where to start? You can ask for a small clue whenever you need one.
          </p>
          <button
            class="hint-button"
            type="button"
            :disabled="hintState === 'loading' || !selectedExercise"
            @click="getHint"
          >
            <span aria-hidden="true">✧</span>
            {{
              hintState === 'error'
                ? 'Try again'
                : hintState === 'success'
                  ? 'Another hint'
                  : 'Give me a hint'
            }}
            <span class="button-arrow" aria-hidden="true">↗</span>
          </button>
        </div>

        <div class="gentle-note"><span aria-hidden="true">♡</span> No rush. Take your time.</div>
      </aside>
    </main>
    <footer class="page-footer">
      <span>Made for curious minds.</span><span>Local prototype <i>·</i> Gleam</span>
    </footer>
  </div>
</template>
