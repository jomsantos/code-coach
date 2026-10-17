mod coach;

use axum::{
    Json, Router,
    extract::{Path, State},
    http::{HeaderValue, Method, StatusCode, header::CONTENT_TYPE},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use coach::{Exercise, HintResponse, RunRequest, RunResponse, exercises, get_exercise, hint, run};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[derive(Clone, Default)]
struct AppState {
    exercises: Arc<Vec<Exercise>>,
}

#[derive(Deserialize, Serialize)]
struct ErrorResponse {
    error: String,
}

#[derive(Debug, PartialEq, Eq)]
struct ApiError {
    status: StatusCode,
    message: &'static str,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(ErrorResponse {
                error: self.message.into(),
            }),
        )
            .into_response()
    }
}

fn to_api_error(error: coach::CoachError) -> ApiError {
    match error {
        coach::CoachError::EmptyCode => ApiError {
            status: StatusCode::BAD_REQUEST,
            message: "Enter some code before continuing.",
        },
        coach::CoachError::ExerciseNotFound => ApiError {
            status: StatusCode::NOT_FOUND,
            message: "That exercise could not be found.",
        },
    }
}

async fn list_exercises(State(state): State<AppState>) -> Json<Vec<Exercise>> {
    Json(state.exercises.as_ref().clone())
}

async fn exercise_detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Exercise>, ApiError> {
    get_exercise(&state.exercises, &id)
        .cloned()
        .map(Json)
        .map_err(to_api_error)
}

async fn run_exercise(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<RunRequest>,
) -> Result<Json<RunResponse>, ApiError> {
    run(&state.exercises, &id, &request.code)
        .map(Json)
        .map_err(to_api_error)
}

async fn get_hint(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<RunRequest>,
) -> Result<Json<HintResponse>, ApiError> {
    hint(&state.exercises, &id, &request.code)
        .map(Json)
        .map_err(to_api_error)
}

fn app(state: AppState) -> Router {
    Router::new()
        .route("/api/v1/exercises", get(list_exercises))
        .route("/api/v1/exercises/{id}", get(exercise_detail))
        .route("/api/v1/exercises/{id}/run", post(run_exercise))
        .route("/api/v1/exercises/{id}/hint", post(get_hint))
        .with_state(state)
        .layer(
            CorsLayer::new()
                .allow_origin([
                    HeaderValue::from_static("http://127.0.0.1:5173"),
                    HeaderValue::from_static("http://localhost:5173"),
                ])
                .allow_methods([Method::GET, Method::POST])
                .allow_headers([CONTENT_TYPE]),
        )
        .layer(TraceLayer::new_for_http())
}

#[tokio::main]
async fn main() {
    let port = std::env::var("CODE_COACH_PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(3000);
    let address = format!("127.0.0.1:{port}");
    let listener = tokio::net::TcpListener::bind(&address)
        .await
        .unwrap_or_else(|error| panic!("could not bind to {address}: {error}"));

    println!("Code Coach API listening on http://{address}");
    axum::serve(
        listener,
        app(AppState {
            exercises: Arc::new(exercises()),
        }),
    )
    .await
    .expect("API server failed");
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request};
    use tower::ServiceExt;

    #[test]
    fn maps_empty_code_to_bad_request() {
        assert_eq!(
            to_api_error(coach::CoachError::EmptyCode),
            ApiError {
                status: StatusCode::BAD_REQUEST,
                message: "Enter some code before continuing.",
            }
        );
    }

    #[test]
    fn maps_unknown_exercise_to_not_found() {
        assert_eq!(
            to_api_error(coach::CoachError::ExerciseNotFound),
            ApiError {
                status: StatusCode::NOT_FOUND,
                message: "That exercise could not be found.",
            }
        );
    }

    #[tokio::test]
    async fn exercises_endpoint_returns_both_samples() {
        let response = app(AppState {
            exercises: Arc::new(exercises()),
        })
        .oneshot(
            Request::builder()
                .uri("/api/v1/exercises")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let received: Vec<Exercise> = serde_json::from_slice(&body).unwrap();
        assert_eq!(received.len(), 2);
        assert_eq!(received[0].id, "hello-world");
    }

    #[tokio::test]
    async fn unknown_exercise_endpoint_returns_json_404() {
        let response = app(AppState {
            exercises: Arc::new(exercises()),
        })
        .oneshot(
            Request::builder()
                .uri("/api/v1/exercises/missing")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let error: ErrorResponse = serde_json::from_slice(&body).unwrap();
        assert_eq!(error.error, "That exercise could not be found.");
    }

    #[tokio::test]
    async fn run_endpoint_returns_a_passing_mock_result() {
        let response = app(AppState {
            exercises: Arc::new(exercises()),
        })
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/exercises/hello-world/run")
                .header(CONTENT_TYPE, "application/json")
                .body(Body::from(
                    r#"{"code":"pub fn greeting() { \"Hello, Gleam!\" }"}"#,
                ))
                .unwrap(),
        )
        .await
        .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let result: RunResponse = serde_json::from_slice(&body).unwrap();
        assert!(result.passed);
        assert_eq!(result.summary, "All checks passed");
    }

    #[tokio::test]
    async fn hint_endpoint_returns_hint_for_selected_exercise() {
        let response = app(AppState {
            exercises: Arc::new(exercises()),
        })
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/exercises/add-two/hint")
                .header(CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"code":"pub fn add_two(a, b) { 0 }"}"#))
                .unwrap(),
        )
        .await
        .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let result: HintResponse = serde_json::from_slice(&body).unwrap();
        assert!(result.hint.contains("+"));
    }

    #[tokio::test]
    async fn run_endpoint_returns_json_400_for_blank_code() {
        let response = app(AppState {
            exercises: Arc::new(exercises()),
        })
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/exercises/hello-world/run")
                .header(CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"code":"  "}"#))
                .unwrap(),
        )
        .await
        .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let error: ErrorResponse = serde_json::from_slice(&body).unwrap();
        assert_eq!(error.error, "Enter some code before continuing.");
    }
}
