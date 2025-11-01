use crate::{
    models::{escrow::Escrows, user::User},
    state::AppState,
};
use axum::{
    Json,
    extract::{Extension, Path},
    http::StatusCode,
};
use serde_json::json;
use tracing::{error, info, warn};

pub async fn create_user(state: &AppState, address: &str) -> Result<String, StatusCode> {
    println!(
        "🟢 [create_user] Attempting to create user with address: {}",
        address
    );

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (address, escrows) VALUES ($1, $2) RETURNING address",
    )
    .bind(address)
    .bind(sqlx::types::Json(Vec::<Escrows>::new()))
    .fetch_one(&state.db)
    .await;

    match user {
        Ok(u) => {
            println!("✅ [create_user] Successfully created user: {}", u.address);
            Ok(u.address)
        }
        Err(e) => {
            eprintln!(
                "❌ [create_user] Failed to create user with address {}. Error: {:?}",
                address, e
            );
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// pub async fn get_users(Extension(state): Extension<AppState>) -> Json<Vec<User>> {
//     let users = sqlx::query_as::<_, User>(r#"SELECT address, escrows FROM "users""#)
//         .fetch_all(&state.db)
//         .await
//         .unwrap_or_default();
//     Json(users)
// }

pub async fn get_user(state: &AppState, address: &str) -> Result<String, StatusCode> {
    let user = sqlx::query_scalar!(r#"SELECT address FROM users WHERE address = $1"#, address)
        .fetch_one(&state.db)
        .await;

    match user {
        Ok(addr) => Ok(addr),
        Err(sqlx::Error::RowNotFound) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn get_or_create_user(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
) -> Result<(StatusCode, String), StatusCode> {
    info!("📩 Incoming request for user with address: {}", address);

    match get_user(&state, &address).await {
        Ok(user) => {
            info!("✅ Found existing user: {:?}", user);
            return Ok((StatusCode::OK, user));
        }
        Err(e) => warn!("⚠️ Could not find user, error: {:?}", e),
    }

    match create_user(&state, &address).await {
        Ok(user) => {
            info!("🆕 Created new user for address: {}", address);
            Ok((StatusCode::CREATED, user))
        }
        Err(e) => {
            error!("❌ Failed to create user: {:?}", e);
            Err(e)
        }
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
