use axum::{Extension, Router};
use dotenvy::dotenv;
use std::env;
use tokio::net::TcpListener;
mod errors;
mod handlers;
mod models;
mod routes;
mod state;
use crate::state::AppState;
use tower_http::cors::Any;
use tower_http::cors::CorsLayer;
use tracing_subscriber;
#[tokio::main]
async fn main() {
    dotenv().ok();
    tracing_subscriber::fmt::init();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let app_state = AppState::new(&database_url).await;
    let cors = CorsLayer::new()
        .allow_origin(Any) // ✅ You can restrict later to your frontend’s origin
        .allow_methods(Any)
        .allow_headers(Any);
    let app = Router::new()
        .nest("/api", routes::create_routes())
        .layer(cors)
        .layer(Extension(app_state.clone()));

    println!("🚀 Server running on http://127.0.0.1:3000");
    let listener = TcpListener::bind("127.0.0.1:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
