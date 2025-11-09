use std::string;

// use anchor_lang::prelude::{Account, AnchorDeserialize, AnchorSerialize};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdatedEscrow {
    pub escrow_pda: String,
    pub status: Status,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Status {
    Pending,
    Completed,
    Cancelled,
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
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EscrowState {
    pub initializer_key: String,
    pub initializer_deposit_token_account: String, // <-- ADD THIS
    pub initializer_deposit_token_mint: String,
    pub taker_expected_token_mint: String,
    pub initializer_amount: String,
    pub taker_expected_amount: String,
    pub initializer_receive_token_account: String,
    pub unique_seed: [u8; 8], // ← FIXED: Added unique seed to state
    pub expires_at: String,
    pub bump: u8,
    pub status: Status,
    pub escrow_key: String,
}
