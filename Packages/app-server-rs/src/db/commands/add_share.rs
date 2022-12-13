use rust_shared::async_graphql::{ID, SimpleObject, InputObject};
use rust_shared::rust_macros::wrap_slow_macros;
use rust_shared::serde_json::{Value, json};
use rust_shared::utils::db_constants::SYSTEM_USER_ID;
use rust_shared::{async_graphql, serde_json, anyhow};
use rust_shared::async_graphql::{Object};
use rust_shared::utils::type_aliases::JSONValue;
use rust_shared::anyhow::{anyhow, Error};
use rust_shared::utils::time::{time_since_epoch_ms_i64};
use rust_shared::serde::{Deserialize};
use tracing::info;

use crate::db::general::sign_in::jwt_utils::{resolve_jwt_to_user_info, get_user_info_from_gql_ctx};
use crate::db::shares::{Share, ShareInput};
use crate::utils::db::accessors::AccessorContext;
use rust_shared::utils::db::uuid::new_uuid_v4_as_b64;
use crate::utils::general::data_anchor::{DataAnchorFor1};

use super::_command::{set_db_entry_by_id_for_struct};

wrap_slow_macros!{

#[derive(InputObject, Deserialize)]
pub struct AddShareInput {
	share: ShareInput,
}

#[derive(SimpleObject, Debug)]
pub struct AddShareResult {
	id: String,
}

#[derive(Default)]
pub struct MutationShard_AddShare;
#[Object]
impl MutationShard_AddShare {
	async fn add_share(&self, gql_ctx: &async_graphql::Context<'_>, input: AddShareInput) -> Result<AddShareResult, Error> {
		let mut anchor = DataAnchorFor1::empty(); // holds pg-client
		let ctx = AccessorContext::new_write(&mut anchor, gql_ctx).await?;
		let user_info = get_user_info_from_gql_ctx(&gql_ctx, &ctx).await?;
		let AddShareInput { share: share_ } = input;
		let mut result = AddShareResult { id: "<tbd>".to_owned() };
		
		let share = Share {
			// set by server
			id: ID(new_uuid_v4_as_b64()),
			creator: user_info.id.to_string(),
			createdAt: time_since_epoch_ms_i64(),
			// pass-through
			name: share_.name,
			r#type: share_.r#type,
			mapID: share_.mapID,
			mapView: share_.mapView,
		};
		result.id = share.id.to_string();

		set_db_entry_by_id_for_struct(&ctx, "shares".to_owned(), share.id.to_string(), share).await?;

		ctx.tx.commit().await?;
		info!("Command completed! Result:{:?}", result);
		Ok(result)
    }
}

}