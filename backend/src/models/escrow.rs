use crate::models::user::Status;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdatedEscrow {
    pub escrow_pda: String,
    pub status: Status,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Escrows {
    pub escrow_pda: String,
    pub offer_amount: u64,
    pub accept_amount: u64,
    pub offer_mint: String,
    pub accept_mint: String,
    pub status: Status,
    pub created_at: chrono::NaiveDateTime,
    pub expires_at: chrono::NaiveDateTime,
    pub expired: bool,
}
