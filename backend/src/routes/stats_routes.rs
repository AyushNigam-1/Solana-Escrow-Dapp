use crate::handlers::stats_handler::get_escrow_stats;
use axum::{Router, routing::get}; // Import your shared state type

pub fn stats_routes() -> Router {
    Router::new().route("/stats", get(get_escrow_stats))
}
