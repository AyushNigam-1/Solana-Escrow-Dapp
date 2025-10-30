use crate::models::user::Status;
use serde::{Deserialize, Serialize};
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Escrows {
    offer_amount: u64,
    accept_amount: u64,
    offer_mint: String,
    accept_mint: String,
    status: Status,
}
