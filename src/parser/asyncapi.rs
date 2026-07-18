use std::collections::BTreeMap;

use serde::Deserialize;
use serde_json::Value;

use crate::error::{Error, Result};

#[derive(Debug, Deserialize)]
pub struct AsyncApiDocument {
    pub asyncapi: String,
    #[serde(default)]
    pub channels: BTreeMap<String, Channel>,
    #[serde(default)]
    pub operations: BTreeMap<String, Operation>,
    #[serde(default)]
    pub messages: BTreeMap<String, Message>,
}

#[derive(Debug, Deserialize)]
pub struct Channel {
    pub address: String,
    #[serde(default)]
    pub messages: BTreeMap<String, RefOr<Message>>,
    #[serde(default)]
    pub bindings: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct Operation {
    pub action: String,
    #[serde(default)]
    pub channel: Option<RefOr<Channel>>,
    #[serde(default)]
    pub message: Option<RefOr<Message>>,
    #[serde(default)]
    pub messages: Vec<RefOr<Message>>,
    #[serde(default)]
    pub bindings: Option<Value>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Message {
    #[serde(default)]
    pub payload: Value,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum RefOr<T> {
    Ref {
        #[serde(rename = "$ref")]
        reference: String,
    },
    Value(T),
}

pub fn parse_asyncapi(input: &str) -> Result<AsyncApiDocument> {
    let yaml_value: serde_yaml::Value = serde_yaml::from_str(input)?;
    let json_value = serde_json::to_value(yaml_value)?;
    let document: AsyncApiDocument = serde_json::from_value(json_value)?;

    if !document.asyncapi.starts_with("3.") {
        return Err(Error::UnsupportedAsyncApiVersion(document.asyncapi));
    }

    Ok(document)
}

pub fn ref_name(reference: &str, prefix: &str) -> Result<String> {
    reference
        .strip_prefix(prefix)
        .map(ToOwned::to_owned)
        .ok_or_else(|| Error::UnsupportedReference(reference.to_string()))
}
