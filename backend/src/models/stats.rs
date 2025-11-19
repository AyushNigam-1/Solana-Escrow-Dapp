use chrono::NaiveDate;
use serde::Serialize;
use sqlx::types::Json as SqlxJson;

use crate::models::escrow::EscrowState;

#[derive(Debug, Serialize, Clone)]
pub struct DailyCreationStats {
    pub date: NaiveDate, // Date without time component (e.g., 2025-11-19)
    pub count: u32,
}
#[derive(Debug, sqlx::FromRow)]
pub struct EscrowRow {
    // The query returns a column named 'escrows' which is a JSON array
    pub escrows: SqlxJson<Vec<EscrowState>>,
}
/// The final response structure for the statistics API
#[derive(Debug, Serialize, Clone)]
pub struct EscrowStatsResponse {
    pub daily_creations: Vec<DailyCreationStats>,
}
