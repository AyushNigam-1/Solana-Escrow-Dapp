use crate::models::escrow::Escrows;
use crate::{AppState, models::escrow::UpdatedEscrow};
use anyhow::Result;
use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use chrono::Duration;
use chrono::TimeZone;
use chrono::Utc;
use serde_json::json;

use sqlx::{PgPool, Row, types::Json as SqlxJson};

pub async fn create_escrow(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
    Json(mut new_escrow): Json<Escrows>,
) -> Result<(StatusCode, Json<serde_json::Value>), StatusCode> {
    println!(
        "📩 Incoming request to create escrow for address: {}",
        address
    );
    println!("🧾 New escrow data received: {:?}", new_escrow);
    let now = Utc::now().naive_utc();
    new_escrow.created_at = now;
    new_escrow.expires_at = now + Duration::hours(24); // 🕒 configurable expiry
    new_escrow.expired = false;
    // Step 1: Fetch current escrows

    println!("🔍 Fetching existing escrows for user: {}", address);
    let existing: Result<(sqlx::types::Json<Vec<Escrows>>,), sqlx::Error> =
        sqlx::query_as(r#"SELECT escrows FROM users WHERE address = $1"#)
            .bind(&address)
            .fetch_one(&state.db)
            .await;

    let mut escrows = match existing {
        Ok((sqlx::types::Json(current),)) => {
            println!("✅ Found existing escrows: {:?}", current);
            current
        }
        Err(sqlx::Error::RowNotFound) => {
            eprintln!("⚠️ User not found for address: {}", address);
            return Err(StatusCode::NOT_FOUND);
        }
        Err(e) => {
            eprintln!(
                "❌ Failed to fetch existing escrows for {}: {:?}",
                address, e
            );
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Step 2: Push new escrow into the array
    println!("➕ Adding new escrow to user {}’s escrow list", address);
    escrows.push(new_escrow);

    // Step 3: Update the record
    println!("💾 Updating user {}’s escrows in the database…", address);
    let res = sqlx::query!(
        r#"UPDATE users SET escrows = $1 WHERE address = $2"#,
        sqlx::types::Json(&escrows) as _,
        address
    )
    .execute(&state.db)
    .await;

    match res {
        Ok(_) => {
            println!("✅ Escrow successfully added for user {}", address);
            Ok((
                StatusCode::OK,
                Json(json!({"message": "Escrow added successfully"})),
            ))
        }
        Err(e) => {
            eprintln!("❌ Failed to update escrows for {}: {:?}", address, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_expired_escrows(db: &PgPool) -> Result<Vec<Escrows>> {
    let now = Utc::now().timestamp();
    let mut expired_escrows = Vec::new();

    // Fetch all users and their escrows
    let rows = sqlx::query(r#"SELECT address, escrows FROM users"#)
        .fetch_all(db)
        .await?;

    for row in rows {
        // let address: String = row.try_get("address").unwrap_or_default(); // Not needed for keeper, but kept for context

        let escrows_json: SqlxJson<Vec<Escrows>> =
            row.try_get("escrows").unwrap_or(SqlxJson(vec![]));

        for escrow in escrows_json.0 {
            // Convert NaiveDateTime to i64 Unix timestamp
            let expires_timestamp = Utc.from_utc_datetime(&escrow.expires_at).timestamp();

            if expires_timestamp <= now {
                // Collect the original Escrow struct, not JSON
                expired_escrows.push(escrow);
            }
        }
    }

    Ok(expired_escrows)
}
pub async fn update_escrow(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
    Json(updated_escrow): Json<UpdatedEscrow>,
) -> Result<(StatusCode, Json<serde_json::Value>), StatusCode> {
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

    if let Some(escrow) = escrows
        .iter_mut()
        .find(|e| e.escrow_pda == updated_escrow.escrow_pda)
    {
        escrow.status = updated_escrow.status.clone();
    } else {
        eprintln!("❌ Escrow not found for PDA: {}", updated_escrow.escrow_pda);
        return Err(StatusCode::NOT_FOUND);
    }
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
            Json(json!({"message": "Escrow status updated successfully"})),
        )),
        Err(e) => {
            eprintln!("❌ Failed to update escrow: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_escrows(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
) -> Result<Json<Vec<Escrows>>, StatusCode> {
    println!(
        "📩 Incoming request to get escrows for address: {}",
        address
    );
    // Perform the query
    let escrows = sqlx::query_as::<_, (sqlx::types::Json<Vec<Escrows>>,)>(
        r#"SELECT escrows FROM "users" WHERE address = $1"#,
    )
    .bind(&address)
    .fetch_one(&state.db)
    .await;

    match escrows {
        Ok((escrows_json,)) => {
            println!(
                "✅ Successfully fetched escrows for address {}: {:?}",
                address, escrows_json.0
            );
            Ok(Json(escrows_json.0))
        }
        Err(sqlx::Error::RowNotFound) => {
            eprintln!("⚠️ No user found for address: {}", address);
            Err(StatusCode::NOT_FOUND)
        }
        Err(e) => {
            eprintln!("❌ Database query failed for address {}: {:?}", address, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
