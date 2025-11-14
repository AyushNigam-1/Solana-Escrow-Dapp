use crate::solana_client::SolanaClient;
use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub solana: Arc<SolanaClient>,
}

impl AppState {
    pub async fn new(
        database_url: &str,
        rpc_url: &str,
        keypair_path: &str,
        program_id: &str,
    ) -> Self {
        // ✅ Connect to Postgres
        let db = PgPoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await
            .expect("❌ Failed to connect to DB");
        let solana = SolanaClient::new(rpc_url, keypair_path, program_id).await;

        Self {
            db,
            solana: Arc::new(solana),
        }
    }
}
