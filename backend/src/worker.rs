// use crate::handlers::escrow_handler::get_expired_escrows;
use crate::models::escrow::Escrows;
use crate::state::AppState;
use std::sync::Arc;
use std::time::Duration;
use tokio::time;
use tracing;
pub async fn run_keeper(state: Arc<AppState>) {
    let interval = Duration::from_secs(60);
    let mut ticker = time::interval(interval);

    loop {
        ticker.tick().await;
        // if let Err(err) = scan_and_cancel(&state).await {
        //     tracing::error!("Keeper error: {:?}", err);
        // }
    }
}

// async fn scan_and_cancel(state: &AppState) -> anyhow::Result<()> {
//     // 1. Fetch expired escrows using the separated, internal logic
//     // This call handles the DB query and filtering, returning the full Escrows structs.
//     let escrows: Vec<Escrows> = get_expired_escrows(&state.db).await?;

//     if escrows.is_empty() {
//         tracing::info!("✅ No expired escrows found");
//         return Ok(());
//     }
//     // 2. Cancel each expired escrow using the efficient, already-initialized SolanaClient
//     for escrow in escrows {
//         // state.solana.cancel_if_expired(&escrow).await?;
//     }
//     Ok(())
// }

// async fn scan_and_cancel(state: &AppState) -> anyhow::Result<()> {
//     // Step 1: Query DB for expired escrows
//     let rows = sqlx::query!(
//         r#"
//         SELECT
//             (escrows ->> 'escrow_pda') AS escrow_pda,
//             (escrows ->> 'expires_at')::BIGINT AS expires_at
//         FROM users, jsonb_array_elements(escrows) AS escrow
//         WHERE (escrows ->> 'expires_at')::BIGINT < EXTRACT(EPOCH FROM NOW())::BIGINT
//         "#
//     )
//     .fetch_all(&state.db)
//     .await?;

//     if rows.is_empty() {
//         tracing::info!("✅ No expired escrows found");
//         return Ok(());
//     }

//     // Step 2: Create a fresh Solana client
//     let solana = SolanaClient::new(&state.rpc_url, &state.keypair_path, &state.program_id).await;

//     // Step 3: Cancel each expired escrow
//     for row in rows {
//         let pubkey_str = row
//             .escrow_pda
//             .as_ref()
//             .ok_or_else(|| anyhow!("Missing pubkey for expired escrow"))?;

//         let pubkey = Pubkey::from_str(pubkey_str)?;
//         let escrow = EscrowAccount {
//             pubkey: pubkey,
//             expires_at: row.expires_at.unwrap_or(0),
//         };

//         tracing::info!("⏳ Cancelling escrow {:?}", escrow.pubkey);
//         if let Err(e) = solana.cancel_if_expired(&escrow).await {
//             tracing::error!("❌ Failed to cancel escrow {:?}: {:?}", escrow.pubkey, e);
//         } else {
//             tracing::info!("✅ Escrow {:?} cancelled", escrow.pubkey);
//         }
//     }
//     Ok(())
// }
