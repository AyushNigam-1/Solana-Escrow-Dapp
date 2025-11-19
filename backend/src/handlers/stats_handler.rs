use crate::AppState;
use crate::models::escrow::EscrowState;
use crate::models::stats::{DailyCreationStats, EscrowRow, EscrowStatsResponse};
use axum::Extension;
use axum::{Json, http::StatusCode};
use chrono::NaiveDate;
use sqlx::types::Json as SqlxJson;
use std::collections::HashMap;

/// Handler for GET /api/v1/stats/escrow_creation
pub async fn get_escrow_stats(
    Extension(state): Extension<AppState>,
) -> Result<Json<EscrowStatsResponse>, (StatusCode, String)> {
    // SQL QUERY: Fetch the JSON array of escrows from ALL rows in the users table.
    let escrow_rows: Vec<EscrowRow> =
        match sqlx::query_as::<_, EscrowRow>(r#"SELECT escrows FROM users"#)
            .fetch_all(&state.db)
            .await
        {
            Ok(rows) => rows,
            Err(e) => {
                eprintln!("Database error fetching escrows: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to query database: {}", e),
                ));
            }
        };

    // 1. Flatten the data: Convert Vec<EscrowRow> into a single Vec<EscrowState>
    let mut all_escrows: Vec<EscrowState> = Vec::new();

    for row in escrow_rows {
        // FIX APPLIED HERE: Using 'Json' directly in the pattern match.
        // This explicitly unpacks the Json wrapper and moves the inner Vec<EscrowState> out.
        let SqlxJson(escrows_vec) = row.escrows;

        // 'escrows_vec' is now an owned Vec<EscrowState> and can be consumed by into_iter()
        all_escrows.extend(escrows_vec.into_iter());
    }

    // 2. Aggregate counts by date using Chrono
    let mut daily_counts: HashMap<NaiveDate, u32> = HashMap::new();

    for escrow in all_escrows.iter() {
        // Convert the DateTime<Utc> to a simple NaiveDate (yyyy-mm-dd) for grouping
        let date_key = escrow.created_at.date_naive();

        // Increment the count for that specific date
        *daily_counts.entry(date_key).or_insert(0) += 1;
    }

    // 3. Convert HashMap into the desired Vector DTO
    let mut daily_creations: Vec<DailyCreationStats> = daily_counts
        .into_iter()
        .map(|(date, count)| DailyCreationStats { date, count })
        .collect();

    // Sort by date (optional, but good practice for API stability)
    daily_creations.sort_by_key(|s| s.date);

    let response = EscrowStatsResponse { daily_creations };

    Ok(Json(response))
}
