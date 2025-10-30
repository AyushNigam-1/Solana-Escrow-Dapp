use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}

impl AppState {
    pub async fn new(database_url: &str) -> Self {
        let db = PgPoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await
            .expect("❌ Failed to connect to DB");
        Self { db }
    }
}
