use crate::models::escrow::EscrowState;
use crate::{AppState, models::escrow::UpdatedEscrow};
use anyhow::Result;
use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use serde_json::json;

pub async fn create_escrow(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
    Json(new_escrow): Json<EscrowState>,
) -> Result<(StatusCode, Json<serde_json::Value>), StatusCode> {
    println!(
        "📩 Incoming request to create escrow for address: {}",
        address
    );
    println!("🧾 New escrow data received: {:?}", new_escrow);
    println!("🔍 Fetching existing escrows for user: {}", address);
    let existing: Result<(sqlx::types::Json<Vec<EscrowState>>,), sqlx::Error> =
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

pub async fn update_escrow(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
    Json(updated_escrow): Json<UpdatedEscrow>,
) -> Result<(StatusCode, Json<serde_json::Value>), StatusCode> {
    println!("Updating escrow");
    let existing: Result<(sqlx::types::Json<Vec<EscrowState>>,), sqlx::Error> =
        sqlx::query_as(r#"SELECT escrows FROM users WHERE address = $1"#)
            .bind(&address)
            .fetch_one(&state.db)
            .await;
    println!("found escrows");
    let mut escrows = match existing {
        Ok((sqlx::types::Json(current),)) => current,
        Err(sqlx::Error::RowNotFound) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };
    if let Some(escrow) = escrows
        .iter_mut()
        .find(|e| e.public_key == updated_escrow.escrow_pda)
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
) -> Result<Json<Vec<EscrowState>>, StatusCode> {
    println!(
        "📩 Incoming request to get escrows for address: {}",
        address
    );
    // Perform the query
    let escrows = sqlx::query_as::<_, (sqlx::types::Json<Vec<EscrowState>>,)>(
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

pub async fn delete_escrow(
    Extension(state): Extension<AppState>,
    Path((address, escrow_pda)): Path<(String, String)>,
) -> Result<(StatusCode, Json<serde_json::Value>), StatusCode> {
    println!(
        "🗑️ Incoming request to delete escrow for address: {}",
        address
    );
    println!("🗝️ Deleting escrow with unique_seed: {}", escrow_pda);

    // Step 1: Fetch existing escrows
    let existing: Result<(sqlx::types::Json<Vec<EscrowState>>,), sqlx::Error> =
        sqlx::query_as(r#"SELECT escrows FROM users WHERE address = $1"#)
            .bind(&address)
            .fetch_one(&state.db)
            .await;

    let mut escrows = match existing {
        Ok((sqlx::types::Json(current),)) => {
            println!("✅ Found {} existing escrows.", current.len());
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

    // Step 2: Find and filter out the escrow to delete
    let initial_count = escrows.len();

    // We filter the list, keeping only the escrows whose unique_seed DOES NOT match
    // the one sent in the request.
    escrows.retain(|e| e.public_key != escrow_pda);

    if escrows.len() == initial_count {
        // If the length didn't change, the escrow wasn't found.
        println!(
            "⚠️ Escrow with unique_seed {} not found in list.",
            escrow_pda
        );
        return Err(StatusCode::NOT_FOUND);
    }

    println!("➖ Removed 1 escrow. New count: {}", escrows.len());

    // Step 3: Update the record with the filtered array
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
            println!("✅ Escrow successfully deleted for user {}", address);
            Ok((
                StatusCode::OK,
                Json(json!({"message": "Escrow deleted successfully"})),
            ))
        }
        Err(e) => {
            eprintln!(
                "❌ Failed to update escrows after deletion for {}: {:?}",
                address, e
            );
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
