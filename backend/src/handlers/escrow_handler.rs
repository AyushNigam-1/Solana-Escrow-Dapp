use crate::AppState;
use crate::models::escrow::Escrows;
use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use serde_json::json;

pub async fn create_escrow(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
    Json(new_escrow): Json<Escrows>,
) -> Result<(StatusCode, Json<serde_json::Value>), StatusCode> {
    // Step 1: Fetch current escrows
    let existing: Result<(sqlx::types::Json<Vec<Escrows>>,), sqlx::Error> =
        sqlx::query_as(r#"SELECT escrows FROM users WHERE address = $1"#)
            .bind(&address)
            .fetch_one(&state.db)
            .await;

    let mut escrows = match existing {
        Ok((sqlx::types::Json(current),)) => current,
        Err(sqlx::Error::RowNotFound) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Step 2: Push new escrow into the array
    escrows.push(new_escrow);

    // Step 3: Update the record
    let res = sqlx::query!(
        r#"UPDATE users SET escrows = $1 WHERE address = $2"#,
        sqlx::types::Json(&escrows) as _,
        address
    )
    .execute(&state.db)
    .await;

    match res {
        Ok(_) => Ok((
            StatusCode::OK,
            Json(json!({"message": "Escrow added successfully"})),
        )),
        Err(e) => {
            eprintln!("❌ Failed to update escrows: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_escrows(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
) -> Result<Json<Vec<Escrows>>, StatusCode> {
    let escrows = sqlx::query_as::<_, (sqlx::types::Json<Vec<Escrows>>,)>(
        r#"SELECT escrows FROM "users" WHERE address = $1"#,
    )
    .bind(address)
    .fetch_one(&state.db)
    .await;

    match escrows {
        Ok((escrows,)) => Ok(Json(escrows.0)),
        Err(sqlx::Error::RowNotFound) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
