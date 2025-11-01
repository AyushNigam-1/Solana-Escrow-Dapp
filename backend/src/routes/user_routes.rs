use crate::handlers::user_handler::{delete_user, get_or_create_user};
use axum::{
    Router,
    routing::{delete, get},
};

pub fn user_routes() -> Router {
    Router::new()
        .route("/users/{id}", delete(delete_user))
        .route("/user/{address}", get(get_or_create_user))
}
