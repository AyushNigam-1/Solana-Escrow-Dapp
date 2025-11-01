use crate::handlers::escrow_handler::{create_escrow, get_escrows, update_escrow};
use axum::{Router, routing::get};

pub fn escrow_routes() -> Router {
    Router::new().route(
        "/escrows/{address}",
        get(get_escrows).post(create_escrow).put(update_escrow),
    )
}
