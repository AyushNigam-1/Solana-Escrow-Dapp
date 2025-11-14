// use crate::handlers::escrow_handler::get_expired_escrows;
// use crate::models::escrow::Escrows;
use crate::models::escrow::Account;
use crate::state::AppState;
use anyhow::anyhow;
use serde_json::{self, Value as JsonValue};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH}; // Added SystemTime and UNIX_EPOCH
use tokio::time;
use tracing::{error, info}; // Assuming AppState is defined in models

pub async fn run_keeper(state: Arc<AppState>) {
    let interval = Duration::from_secs(60);
    let mut ticker = time::interval(interval);

    loop {
        ticker.tick().await;
        if let Err(err) = scan_and_cancel(&state).await {
            error!("Keeper error: {:?}", err);
        }
    }
}

async fn scan_and_cancel(state: &AppState) -> anyhow::Result<()> {
    // Step 1: Query DB for expired escrows (UPDATED: Include user address for update query and initializer_key)
    let row = sqlx::query!(
        r#"
        SELECT
            users.address,
            t.escrow_data AS "escrow_data: sqlx::types::JsonValue"
        FROM
            users,
            jsonb_array_elements(users.escrows) AS t(escrow_data)
        WHERE
            t.escrow_data ->> 'status' = 'Pending'
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
            let user_address = record.address;

            let escrow_json = record
                .escrow_data
                .expect("SQL record 'escrow_data' was unexpectedly null.");
            // We also need the Solana pubkey for logging/cancellation
            let escrow_pubkey = escrow_json
                .get("publicKey")
                .and_then(|pk| pk.as_str())
                .unwrap_or("[Unknown Pubkey]");
            let nested_account_value: JsonValue = escrow_json
                .get("account")
                .ok_or_else(|| anyhow!("Escrow JSON missing 'account' property"))?
                .clone(); // 1. Safely extract the nested 'expiresAt' hex string
            let mut escrow_account_data: Account = serde_json::from_value(nested_account_value)
                .map_err(|e| anyhow!("Failed to deserialize nested 'account': {}", e))?;

            // ENSURE: Set user address as initializer_key (pass/fix if missing or incorrect)
            escrow_account_data.initializer_key = user_address.clone(); // ← Set to user's address (wallet pubkey string)

            info!("{:#?}", escrow_account_data);
            let expires_at_hex = escrow_json
                .get("account")
                .and_then(|account| account.get("expiresAt"))
                .and_then(|expires_at| expires_at.as_str())
                .ok_or_else(|| {
                    anyhow!(
                        "Escrow {}: Could not find nested 'account.expiresAt' field.",
                        escrow_pubkey
                    )
                })?;
            // 2. Parse the hex string (e.g., "691bd959") to a u64 timestamp (seconds)
            let expires_at_timestamp_seconds =
                u64::from_str_radix(expires_at_hex, 16).map_err(|e| {
                    anyhow!(
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
                info!(
                    "🚨 Escrow {} EXPIRED! Expiration Time ({}s) vs Current Time ({}s).",
                    escrow_pubkey, expires_at_timestamp_seconds, now_seconds_u64
                );
                match state
                    .solana
                    .cancel_if_expired(escrow_pubkey.to_string(), &escrow_account_data) // Now passes updated initializer_key
                    .await
                {
                    Ok(_) => {
                        info!("✅ Escrow {} canceled successfully.", escrow_pubkey);
                        // Custom SQL UPDATE query to set status to "Canceled"
                        let update_rows = sqlx::query(
                            r#"
                            UPDATE users
                            SET escrows = (
                                SELECT jsonb_agg(updated_escrow)
                                FROM (
                                    SELECT
                                        CASE
                                            WHEN escrow_elem->>'publicKey' = $1
                                            THEN jsonb_set(escrow_elem, '{status}', '"Expired"')
                                            ELSE escrow_elem
                                        END AS updated_escrow
                                    FROM jsonb_array_elements(users.escrows) AS escrow_elem
                                ) AS updated_elements
                            )
                            WHERE address = $2
                            "#,
                        )
                        .bind(escrow_pubkey) // $1: escrow_pda (publicKey to match)
                        .bind(&user_address) // $2: user address
                        .execute(&state.db)
                        .await;

                        match update_rows {
                            Ok(res) => {
                                if res.rows_affected() > 0 {
                                    info!(
                                        "✅ DB status updated to 'Expired' for escrow {} (user {}).",
                                        escrow_pubkey, user_address
                                    );
                                } else {
                                    info!(
                                        "⚠️ No rows updated for escrow {} (user {})—escrow may not exist.",
                                        escrow_pubkey, user_address
                                    );
                                }
                            }
                            Err(e) => {
                                info!(
                                    "⚠️ Failed to update DB for canceled escrow {} (user {}): {}. Manual sync may be needed.",
                                    escrow_pubkey, user_address, e
                                );
                                // Don't fail the whole scan—log and continue
                            }
                        }
                    }
                    Err(e) => {
                        info!(
                            "❌ Failed to cancel escrow {}: {}. Retrying next cycle.",
                            escrow_pubkey, e
                        );
                        // Don't return Err—keep worker running for retries
                    }
                }
            } else {
                let difference = expires_at_timestamp_seconds - now_seconds_u64;
                info!(
                    "⏳ Escrow {} NOT EXPIRED yet. Expires in {} seconds. Worker waits for the next cycle.",
                    escrow_pubkey, difference
                );
                // Since this is the soonest-to-expire escrow, if it's not expired,
                // no other escrow can be, so we do nothing until the next tick.
            }
        }
        None => {
            info!("✅ No active escrows found to check.");
        }
    }
    Ok(())
}
