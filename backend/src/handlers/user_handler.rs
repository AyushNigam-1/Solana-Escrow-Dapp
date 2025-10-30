use crate::{
    models::escrow::Escrows,
    models::user::{CreateUser, User},
    state::AppState,
};
use axum::{
    Json,
    extract::{Extension, Path},
    http::StatusCode,
};
use serde_json::json;

pub async fn create_user(
    Extension(state): Extension<AppState>,
    Json(payload): Json<CreateUser>,
) -> (StatusCode, Json<serde_json::Value>) {
    let query = sqlx::query("INSERT INTO users (address, escrows) VALUES ($1, $2)")
        .bind(&payload.address)
        .bind(sqlx::types::Json(Vec::<Escrows>::new()))
        .execute(&state.db)
        .await;

    match query {
        Ok(_) => (
            StatusCode::CREATED,
            Json(json!({"message": "User created"})),
        ),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

pub async fn get_users(Extension(state): Extension<AppState>) -> Json<Vec<User>> {
    let users = sqlx::query_as::<_, User>(r#"SELECT address, escrows FROM "users""#)
        .fetch_all(&state.db)
        .await
        .unwrap_or_default();
    Json(users)
}

pub async fn get_user(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
) -> Result<Json<User>, StatusCode> {
    let user =
        sqlx::query_as::<_, User>(r#"SELECT address, escrows FROM "users" WHERE address = $1"#)
            .bind(address)
            .fetch_one(&state.db)
            .await;

    match user {
        Ok(u) => Ok(Json(u)),
        Err(sqlx::Error::RowNotFound) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn delete_user(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
) -> (StatusCode, Json<serde_json::Value>) {
    let res = sqlx::query!(r#"DELETE FROM "users" WHERE address = $1"#, address)
        .execute(&state.db)
        .await;

    match res {
        Ok(_) => (StatusCode::OK, Json(json!({"message": "User deleted"}))),
        Err(_) => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "User not found"})),
        ),
    }
}
