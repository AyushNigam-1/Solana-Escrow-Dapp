use anyhow::Result;
use std::sync::Arc;
use std::time::Duration;
use tokio::time;
use tracing;

use crate::state::AppState;

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

async fn scan_and_cancel(state: &AppState) -> Result<()> {
    let escrows = state.solana.get_expired_escrows().await?;

    for escrow in escrows {
        state.solana.cancel_if_expired(&escrow).await?;
    }

    Ok(())
}
