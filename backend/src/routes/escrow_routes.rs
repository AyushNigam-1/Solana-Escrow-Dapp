use crate::handlers::escrow_handler::{create_escrow, get_escrows};
use axum::{Router, routing::get};

pub fn escrow_routes() -> Router {
    Router::new().route("/escrows", get(get_escrows).post(create_escrow))
}
