// use chrono::NaiveDateTime;
use crate::models::escrow::Escrows;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use sqlx::types::Json;
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Status {
    Pending,
    Completed,
    Cancelled,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct User {
    pub address: String,
    pub escrows: Json<Vec<Escrows>>,
}
