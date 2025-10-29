use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{
    net::SocketAddr,
    sync::{Arc, Mutex},
};

// 1️⃣ Shared app state
#[derive(Default)]
struct AppState {
    todos: Mutex<Vec<Todo>>,
}

// 2️⃣ Our Todo model
#[derive(Serialize, Deserialize, Clone)]
struct Todo {
    id: usize,
    title: String,
    completed: bool,
}

// 3️⃣ Custom error type
#[derive(Debug)]
enum AppError {
    NotFound,
    BadRequest(String),
    InternalError(String),
}

// 4️⃣ Convert custom errors into HTTP responses
impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        match self {
            AppError::NotFound => (StatusCode::NOT_FOUND, "Todo not found").into_response(),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg).into_response(),
            AppError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg).into_response(),
        }
    }
}

// 5️⃣ Request body for creating todos
#[derive(Deserialize)]
struct CreateTodo {
    title: String,
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState::default());

    let app = Router::new()
        .route("/todos", get(list_todos).post(create_todo))
        .route("/todos/complete/:id", post(complete_todo))
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("🚀 Server running at http://{}", addr);

    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

// 6️⃣ List todos
async fn list_todos(State(state): State<Arc<AppState>>) -> Result<Json<Vec<Todo>>, AppError> {
    let todos = state.todos.lock().map_err(|_| AppError::InternalError("Mutex poisoned".into()))?;
    Ok(Json(todos.clone()))
}

// 7️⃣ Create todo
async fn create_todo(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateTodo>,
) -> Result<Json<Todo>, AppError> {
    if payload.title.trim().is_empty() {
        return Err(AppError::BadRequest("Title cannot be empty".into()));
    }

    let mut todos = state.todos.lock().map_err(|_| AppError::InternalError("Mutex error".into()))?;
    let new_todo = Todo {
        id: todos.len() + 1,
        title: payload.title,
        completed: false,
    };
    todos.push(new_todo.clone());
    Ok(Json(new_todo))
}

// 8️⃣ Mark todo as completed
async fn get_todo(Path(id): Path<usize>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Todo>, AppError> {
    let mut todos = state.todos.lock().map_err(|_| AppError::InternalError("Mutex error".into()))?;
if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
        Ok(Json(todo.clone()))
    } else {
        Err(AppError::NotFound)
    }

}

async fn complete_todo(
    Path(id): Path<usize>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Todo>, AppError> {
    let mut todos = state.todos.lock().map_err(|_| AppError::InternalError("Mutex error".into()))?;

    if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
        todo.completed = true;
        Ok(Json(todo.clone()))
    } else {
        Err(AppError::NotFound)
    }
}
