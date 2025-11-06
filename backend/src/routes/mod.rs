pub mod escrow_routes;
pub mod user_routes;
use axum::Router;

pub fn create_routes() -> Router {
    Router::new()
        .merge(user_routes::user_routes())
        .merge(escrow_routes::escrow_routes())
}
