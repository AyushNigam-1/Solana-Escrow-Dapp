use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub rpc_url: String,
    pub keypair_path: String,
    pub program_id: String,
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

        Self {
            db,
            rpc_url: rpc_url.to_string(),
            keypair_path: keypair_path.to_string(),
            program_id: program_id.to_string(),
        }
    }
}
