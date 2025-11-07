use crate::models::escrow::Escrows; // Assuming AppState is defined in models
use anyhow::{Result, anyhow};
use chrono::{TimeZone, Utc};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_program::sysvar; // Import sysvar to get clock ID
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    message::Message,
    pubkey::Pubkey,
    signature::{Keypair, Signer, read_keypair_file},
    transaction::Transaction,
};
use sqlx::{PgPool, Row, types::Json as SqlxJson};
use std::str::FromStr;

const CANCEL_IX_DISCRIMINATOR: [u8; 8] = [169, 41, 17, 179, 5, 248, 18, 22];
// Assuming the Global Stats PDA seed for the client to find the key
const GLOBAL_STATS_SEED: &[u8] = b"global-stats";

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

    /// Fetches all expired escrows from the database and returns them as a clean Vec<Escrows>.
    pub async fn get_expired_escrows(&self, db: &PgPool) -> Result<Vec<Escrows>> {
        let now = Utc::now().timestamp();
        let mut expired_escrows = Vec::new();

        // Fetch all users and their escrows
        let rows = sqlx::query(r#"SELECT address, escrows FROM users"#)
            .fetch_all(db)
            .await
            .map_err(|e| anyhow!("Database error fetching escrows: {}", e))?;

        for row in rows {
            let escrows_json: SqlxJson<Vec<Escrows>> =
                row.try_get("escrows").unwrap_or(SqlxJson(vec![]));

            for escrow in escrows_json.0 {
                // Convert NaiveDateTime to i64 Unix timestamp
                let expires_timestamp = Utc.from_utc_datetime(&escrow.expires_at).timestamp();

                if expires_timestamp <= now {
                    expired_escrows.push(escrow);
                }
            }
        }

        Ok(expired_escrows)
    }

    // --- 2. The requested function to call the Anchor 'cancel' instruction ---
    // Creates and sends the transaction to cancel an expired escrow.
    // pub async fn cancel_if_expired(&self, escrow: &Escrows) -> anyhow::Result<()> {
    //     // tracing::info!("Attempting to cancel expired escrow: {}", escrow.);

    //     // --- 1. Define Account Metas (Must match Anchor Context exactly) ---
    //     // Context accounts from Anchor:
    //     // 1. [mut, signer] initializer
    //     // 2. [mut] initializer_deposit_token_account
    //     // 3. [mut] vault_account
    //     // 4. [read] initializer_deposit_mint
    //     // 5. [mut, close] escrow_state
    //     // 6. [mut] global_stats
    //     // 7. [read] token_program
    //     // (Implicit) system_program (needed for close)
    //     // (Implicit) clock (needed for Clock::get() in event)

    //     let accounts = vec![
    //         // 1. Initializer (Payer/Fee Payer, Signer, Mutable to receive rent refund)
    //         // The keeper's keypair acts as the transaction signer.
    //         AccountMeta::new(self.payer.pubkey(), true),
    //         // 2. Initializer Refund Token Account (Mutable, not signer)
    //         AccountMeta::new(escrow.initializer_deposit_token_account, false),
    //         // 3. Vault Account (Mutable, not signer)
    //         AccountMeta::new(escrow.vault_account, false),
    //         // 4. Deposit Mint (Read-only, not signer)
    //         AccountMeta::new_readonly(escrow.initializer_deposit_token_mint, false),
    //         // 5. Escrow State PDA (Mutable, not signer)
    //         AccountMeta::new(escrow.address, false),
    //         // 6. Global Stats PDA (Mutable, not signer)
    //         AccountMeta::new(escrow.global_stats_key, false),
    //         // 7. Token Program ID (Read-only, not signer)
    //         AccountMeta::new_readonly(escrow.token_program_id, false),
    //         // 8. System Program (Read-only, needed for account closing)
    //         AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
    //         // 9. Clock Sysvar (Read-only, needed for Anchor's Clock::get())
    //         AccountMeta::new_readonly(sysvar::clock::id(), false),
    //     ];

    //     // --- 2. Create Instruction ---
    //     let instruction = Instruction {
    //         program_id: self.program_id,
    //         // The instruction data is only the 8-byte discriminator for a cancel function with no arguments
    //         data: CANCEL_IX_DISCRIMINATOR.to_vec(),
    //         accounts,
    //     };

    //     // --- 3. Assemble Transaction ---
    //     let latest_blockhash = self.rpc.get_latest_blockhash().await?;

    //     let message = Message::new(
    //         &[instruction],
    //         Some(&self.payer.pubkey()), // Payer is the fee payer for the transaction
    //     );

    //     let mut transaction = Transaction::new_unsigned(message);
    //     transaction.sign(&[&self.payer], latest_blockhash); // Sign with the keeper's payer keypair

    //     // --- 4. Send and Confirm ---
    //     match self.rpc.send_and_confirm_transaction(&transaction).await {
    //         Ok(sig) => {
    //             tracing::info!(
    //                 "✅ Successfully canceled escrow {}: Signature: {}",
    //                 escrow.address,
    //                 sig
    //             );
    //             Ok(())
    //         }
    //         Err(e) => {
    //             tracing::error!("❌ Failed to cancel escrow {}: {:?}", escrow.address, e);
    //             // Return an error for the worker to log and potentially retry
    //             Err(anyhow!("Solana transaction failed: {}", e))
    //         }
    //     }
    // }
}
