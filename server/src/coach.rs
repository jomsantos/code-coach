use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Exercise {
    pub id: String,
    pub title: String,
    pub objective: String,
    pub instructions: String,
    pub topic: String,
    pub difficulty: String,
    pub starter_code: String,
    pub example: String,
    #[serde(skip)]
    success_marker: String,
    #[serde(skip)]
    hint_text: String,
}

#[derive(Debug, Deserialize)]
pub struct RunRequest {
    pub code: String,
}

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RunResponse {
    pub passed: bool,
    pub summary: String,
    pub output: String,
}

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct HintResponse {
    pub hint: String,
}

#[derive(Debug, PartialEq, Eq)]
pub enum CoachError {
    EmptyCode,
    ExerciseNotFound,
}

pub fn exercises() -> Vec<Exercise> {
    vec![
        Exercise {
            id: "hello-world".into(),
            title: "Say hello".into(),
            objective: "Build confidence with a small Gleam function.".into(),
            instructions: "Write a function that returns the greeting shown in the example.".into(),
            topic: "Functions".into(),
            difficulty: "Beginner".into(),
            starter_code: "pub fn greeting() -> String {\n  \"\"\n}".into(),
            example: "greeting() // \"Hello, Gleam!\"".into(),
            success_marker: "Hello, Gleam!".into(),
            hint_text: "A Gleam string is written between double quotes. Return the greeting as a string from your function.".into(),
        },
        Exercise {
            id: "add-two".into(),
            title: "Add two numbers".into(),
            objective: "Practice function arguments and integer arithmetic.".into(),
            instructions: "Complete the function so it returns the sum of its two integer arguments.".into(),
            topic: "Integers".into(),
            difficulty: "Beginner".into(),
            starter_code: "pub fn add_two(a: Int, b: Int) -> Int {\n  0\n}".into(),
            example: "add_two(20, 22) // 42".into(),
            success_marker: "a + b".into(),
            hint_text: "The function already receives both values. Try using the `+` operator to combine them.".into(),
        },
    ]
}

pub fn get_exercise<'a>(items: &'a [Exercise], id: &str) -> Result<&'a Exercise, CoachError> {
    items
        .iter()
        .find(|exercise| exercise.id == id)
        .ok_or(CoachError::ExerciseNotFound)
}

pub fn validate_code(code: &str) -> Result<(), CoachError> {
    if code.trim().is_empty() {
        Err(CoachError::EmptyCode)
    } else {
        Ok(())
    }
}

pub fn run(items: &[Exercise], id: &str, code: &str) -> Result<RunResponse, CoachError> {
    validate_code(code)?;
    let exercise = get_exercise(items, id)?;
    let passed = code.contains(&exercise.success_marker);

    Ok(if passed {
        RunResponse {
            passed: true,
            summary: "All checks passed".into(),
            output: format!("✓ Example check passed: {}", exercise.example),
        }
    } else {
        RunResponse {
            passed: false,
            summary: "One check still needs work".into(),
            output: format!("✗ Example check failed: {}", exercise.example),
        }
    })
}

pub fn hint(items: &[Exercise], id: &str, code: &str) -> Result<HintResponse, CoachError> {
    validate_code(code)?;
    let exercise = get_exercise(items, id)?;
    Ok(HintResponse {
        hint: exercise.hint_text.clone(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defines_two_distinct_exercises_with_required_fields() {
        let samples = exercises();
        assert_eq!(samples.len(), 2);
        assert_ne!(samples[0].id, samples[1].id);
        assert!(
            !samples
                .iter()
                .any(|item| item.title.is_empty() || item.starter_code.is_empty())
        );
    }

    #[test]
    fn finds_existing_exercise_and_rejects_missing_one() {
        let samples = exercises();
        assert_eq!(
            get_exercise(&samples, "hello-world").unwrap().title,
            "Say hello"
        );
        assert_eq!(
            get_exercise(&samples, "missing"),
            Err(CoachError::ExerciseNotFound)
        );
    }

    #[test]
    fn validates_blank_and_nonblank_code() {
        assert_eq!(validate_code(" \n "), Err(CoachError::EmptyCode));
        assert_eq!(validate_code("pub fn answer() { 42 }"), Ok(()));
    }

    #[test]
    fn run_passes_when_expected_behavior_is_present() {
        let result = run(&exercises(), "hello-world", "\"Hello, Gleam!\"").unwrap();
        assert!(result.passed);
        assert_eq!(result.summary, "All checks passed");
    }

    #[test]
    fn run_fails_when_expected_behavior_is_absent() {
        let result = run(&exercises(), "hello-world", "\"Hi\"").unwrap();
        assert!(!result.passed);
        assert!(result.output.contains("Example check failed"));
    }

    #[test]
    fn run_rejects_empty_code_and_unknown_exercise() {
        assert_eq!(
            run(&exercises(), "hello-world", "  "),
            Err(CoachError::EmptyCode)
        );
        assert_eq!(
            run(&exercises(), "missing", "some code"),
            Err(CoachError::ExerciseNotFound)
        );
    }

    #[test]
    fn hint_is_exercise_specific_and_rejects_invalid_inputs() {
        let samples = exercises();
        let hello_hint = hint(&samples, "hello-world", "pub fn greeting() { \"\" }").unwrap();
        let add_hint = hint(&samples, "add-two", "pub fn add_two(a, b) { 0 }").unwrap();
        assert_ne!(hello_hint, add_hint);
        assert_eq!(
            hint(&samples, "hello-world", " "),
            Err(CoachError::EmptyCode)
        );
        assert_eq!(
            hint(&samples, "missing", "some code"),
            Err(CoachError::ExerciseNotFound)
        );
    }
}
