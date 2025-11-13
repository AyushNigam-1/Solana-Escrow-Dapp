// use crate::handlers::escrow_handler::get_expired_escrows;
// use crate::models::escrow::Escrows;
use crate::state::AppState;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH}; // Added SystemTime and UNIX_EPOCH
use tokio::time;
use tracing;
pub async fn run_keeper(state: Arc<AppState>) {
    let interval = Duration::from_secs(60);
    let mut ticker = time::interval(interval);

    loop {
        ticker.tick().await;
        if let Err(err) = scan_and_cancel(&state).await {
            tracing::error!("Keeper error: {:?}", err);
        }
    }
}

async fn scan_and_cancel(state: &AppState) -> anyhow::Result<()> {
    // Step 1: Query DB for expired escrows
    let row = sqlx::query!(
        r#"
        SELECT 
            t.escrow_data AS "escrow_data: sqlx::types::JsonValue"
        FROM 
            users, 
            jsonb_array_elements(users.escrows) AS t(escrow_data)
        WHERE
            t.escrow_data IS NOT NULL
        ORDER BY 
            -- Order by the nested 'expiresAt' hex string, assuming lexicographical 
            -- order works for your hex timestamps.
            t.escrow_data -> 'account' ->> 'expiresAt' ASC
        LIMIT 1 -- CRITICAL: Only retrieve the single highest-priority candidate
        "#
    )
    .fetch_optional(&state.db) // Use fetch_optional since we expect zero or one row
    .await?;

    match row {
        Some(record) => {
            let escrow_json = record
                .escrow_data
                .expect("SQL record 'escrow_data' was unexpectedly null.");

            // We also need the Solana pubkey for logging/cancellation
            let escrow_pubkey = escrow_json
                .get("pubkey")
                .and_then(|pk| pk.as_str())
                .unwrap_or("[Unknown Pubkey]");

            // 1. Safely extract the nested 'expiresAt' hex string
            let expires_at_hex = escrow_json
                .get("account")
                .and_then(|account| account.get("expiresAt"))
                .and_then(|expires_at| expires_at.as_str())
                .ok_or_else(|| {
                    anyhow::anyhow!(
                        "Escrow {}: Could not find nested 'account.expiresAt' field.",
                        escrow_pubkey
                    )
                })?;

            // 2. Parse the hex string (e.g., "691bd959") to a u64 timestamp (seconds)
            let expires_at_timestamp_seconds =
                u64::from_str_radix(expires_at_hex, 16).map_err(|e| {
                    anyhow::anyhow!(
                        "Escrow {}: Failed to parse hex timestamp '{}': {}",
                        escrow_pubkey,
                        expires_at_hex,
                        e
                    )
                })?;

            // 3. Get current time in seconds since epoch
            let now_seconds_u64 = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();

            // 4. Compare the timestamps and determine if expired
            if expires_at_timestamp_seconds < now_seconds_u64 {
                // If the expiration time is less than the current time, it's expired.
                tracing::info!(
                    "🚨 Escrow {} EXPIRED! Expiration Time ({}s) vs Current Time ({}s).",
                    escrow_pubkey,
                    expires_at_timestamp_seconds,
                    now_seconds_u64
                );

                // --- ACTION: Execute the actual cancellation transaction here ---
                tracing::info!(
                    "--- ACTION: Cancel function would be called for Escrow: {} ---",
                    escrow_pubkey
                );

                // IMPORTANT: You MUST update the database *after* successful cancellation
                // to remove this escrow from the array, otherwise it will be picked up
                // in the next cycle, creating a cancellation loop for a single escrow.
                // update_escrow_status_in_db(escrow_pubkey).await?;
            } else {
                let difference = expires_at_timestamp_seconds - now_seconds_u64;
                tracing::info!(
                    "⏳ Escrow {} NOT EXPIRED yet. Expires in {} seconds. Worker waits for the next cycle.",
                    escrow_pubkey,
                    difference
                );
                // Since this is the soonest-to-expire escrow, if it's not expired,
                // no other escrow can be, so we do nothing until the next tick.
            }
        }
        None => {
            tracing::info!("✅ No active escrows found to check.");
        }
    }

    Ok(())
}
