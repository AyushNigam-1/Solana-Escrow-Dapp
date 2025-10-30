use crate::handlers::user_handler::{create_user, delete_user, get_user, get_users};
use axum::{
    Router,
    routing::{delete, get},
};

pub fn user_routes() -> Router {
    Router::new()
        .route("/users", get(get_users).post(create_user))
        .route("/users/{id}", delete(delete_user))
        .route("/user/{address}", get(get_user))
}
