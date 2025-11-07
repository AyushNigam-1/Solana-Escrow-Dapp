use crate::models::user::Status;
use serde::{Deserialize, Serialize};
use solana_sdk::pubkey::Pubkey;

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

pub struct EscrowState {
    pub initializer_key: Pubkey,
    pub initializer_deposit_token_account: Pubkey, // <-- ADD THIS
    pub initializer_deposit_token_mint: Pubkey,
    pub taker_expected_token_mint: Pubkey,
    pub initializer_amount: u64,
    pub taker_expected_amount: u64,
    pub initializer_receive_token_account: Pubkey,
    pub unique_seed: [u8; 8], // ← FIXED: Added unique seed to state
    pub expires_at: i64,
    pub bump: u8,
}
