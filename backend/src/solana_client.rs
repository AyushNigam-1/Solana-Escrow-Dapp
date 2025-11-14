use crate::models::escrow::Account; // Assuming AppState is defined in models
use anyhow::anyhow;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{Keypair, Signer, read_keypair_file},
    transaction::Transaction,
};
use std::str::FromStr;
use tracing::{error, info};

const CANCEL_IX_DISCRIMINATOR: [u8; 8] = [232, 219, 223, 41, 219, 236, 220, 190];

// Assuming the Global Stats PDA seed for the client to find the key

// --- 1. SolanaClient Definition ---
pub struct SolanaClient {
    pub rpc: RpcClient,
    pub payer: Keypair,
    pub program_id: Pubkey, // The Anchor Program ID
}

impl SolanaClient {
    // Constructor
    pub async fn new(rpc_url: &str, keypair_path: &str, program_id: &str) -> Self {
        // NOTE: The `read_keypair_file` takes care of the "~" expansion for the path
        let payer =
            read_keypair_file(keypair_path).expect("❌ Failed to read keypair file for Payer");
        let program_id = Pubkey::from_str(program_id).expect("❌ Invalid program ID");
        let rpc = RpcClient::new(rpc_url.to_string());

        Self {
            rpc,
            payer,
            program_id,
        }
    }

    // --- 2. The requested function to call the Anchor 'cancel' instruction ---
    // Creates and sends the transaction to cancel an expired escrow.

    pub async fn cancel_if_expired(&self, pub_key: String, escrow: &Account) -> anyhow::Result<()> {
        // tracing::info!("Attempting to cancel expired escrow: {}", escrow.);
        let escrow_pda = Pubkey::from_str(&pub_key)?;
        let vault_seeds = &[
            b"vault",
            escrow_pda.as_ref(), // 32-byte array
        ];

        let (vault_pda, _) = Pubkey::find_program_address(vault_seeds, &self.program_id);

        let (global_stats_pda, _) =
            Pubkey::find_program_address(&[b"global-stats"], &self.program_id);

        let token_program_id = self
            .rpc
            .get_account(&Pubkey::from_str(&escrow.initializer_deposit_token_mint)?)
            .await?;

        let accounts = vec![
            AccountMeta::new(self.payer.pubkey(), true),
            AccountMeta::new(
                Pubkey::from_str(&escrow.initializer_deposit_token_account)?,
                false,
            ),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new_readonly(
                Pubkey::from_str(&escrow.initializer_deposit_token_mint)?,
                false,
            ),
            AccountMeta::new(Pubkey::from_str(&pub_key)?, false),
            AccountMeta::new(global_stats_pda, false),
            AccountMeta::new_readonly(token_program_id.owner, false),
        ];

        // --- 2. Create Instruction ---
        // Create instruction with correct discriminator (no args for cancel)
        let instruction = Instruction {
            program_id: self.program_id,
            data: CANCEL_IX_DISCRIMINATOR.to_vec(),
            accounts,
        };

        // Assemble transaction (modern API - FIXED deprecated Message::new)
        let latest_blockhash = self.rpc.get_latest_blockhash().await?;
        // .context("Failed to get latest blockhash")?;

        let tx = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&self.payer.pubkey()), // Fee payer
            &[&self.payer],             // Signers
            latest_blockhash,
        );

        // Send and confirm
        match self.rpc.send_and_confirm_transaction(&tx).await {
            Ok(sig) => {
                info!(
                    "✅ Successfully canceled escrow {}: Signature: {}",
                    pub_key, sig
                );
                Ok(())
            }
            Err(e) => {
                error!("❌ Failed to cancel escrow {}: {:?}", pub_key, e);
                Err(anyhow!("Solana transaction failed: {}", e))
            }
        }
    }
}
