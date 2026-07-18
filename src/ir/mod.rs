use serde_json::Value;

use crate::{
    error::{Error, Result},
    parser::asyncapi::{
        AsyncApiDocument, Channel, Message, Operation as AsyncOperation, RefOr, ref_name,
    },
    utils::{to_camel_case, to_pascal_case},
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Action {
    Send,
    Receive,
}

#[derive(Debug, Clone)]
pub struct ClientSpec {
    pub operations: Vec<Operation>,
}

#[derive(Debug, Clone)]
pub struct Operation {
    pub name: String,
    pub action: Action,
    pub topic: Topic,
    pub payload_type_name: String,
    pub payload_schema: Value,
    pub qos: Option<u8>,
}

#[derive(Debug, Clone)]
pub struct Topic {
    pub template: String,
    pub parameters: Vec<Parameter>,
}

#[derive(Debug, Clone)]
pub struct Parameter {
    pub name: String,
}

impl ClientSpec {
    pub fn from_document(document: &AsyncApiDocument) -> Result<Self> {
        let mut operations = Vec::new();

        for (operation_name, operation) in &document.operations {
            let channel = resolve_operation_channel(operation_name, operation, document)?;
            let message = resolve_operation_message(operation_name, operation, channel, document)?;
            let action = parse_action(operation_name, &operation.action)?;
            let topic = Topic::from_address(&channel.address);
            let qos = mqtt_qos(operation.bindings.as_ref())
                .or_else(|| mqtt_qos(channel.bindings.as_ref()));

            operations.push(Operation {
                name: operation_name.clone(),
                action,
                topic,
                payload_type_name: format!("{}Payload", to_pascal_case(operation_name)),
                payload_schema: message.payload.clone(),
                qos,
            });
        }

        Ok(Self { operations })
    }
}

impl Topic {
    pub fn from_address(address: &str) -> Self {
        let parameters = extract_topic_parameters(address)
            .into_iter()
            .map(|name| Parameter { name })
            .collect();

        Self {
            template: address.to_string(),
            parameters,
        }
    }
}

pub fn extract_topic_parameters(address: &str) -> Vec<String> {
    let mut parameters = Vec::new();
    let mut chars = address.char_indices().peekable();

    while let Some((_, ch)) = chars.next() {
        if ch != '{' {
            continue;
        }

        let mut name = String::new();
        for (_, inner) in chars.by_ref() {
            if inner == '}' {
                break;
            }
            name.push(inner);
        }

        if !name.is_empty() && !parameters.contains(&name) {
            parameters.push(name);
        }
    }

    parameters
}

fn parse_action(operation_name: &str, action: &str) -> Result<Action> {
    match action {
        "send" => Ok(Action::Send),
        "receive" => Ok(Action::Receive),
        other => Err(Error::UnsupportedOperationAction(
            operation_name.to_string(),
            other.to_string(),
        )),
    }
}

fn resolve_operation_channel<'a>(
    operation_name: &str,
    operation: &'a AsyncOperation,
    document: &'a AsyncApiDocument,
) -> Result<&'a Channel> {
    match operation.channel.as_ref() {
        Some(RefOr::Ref { reference }) => {
            let name = ref_name(reference, "#/channels/")?;
            document
                .channels
                .get(&name)
                .ok_or(Error::MissingChannel(name))
        }
        Some(RefOr::Value(channel)) => Ok(channel),
        None => Err(Error::MissingOperationChannel(operation_name.to_string())),
    }
}

fn resolve_operation_message<'a>(
    operation_name: &str,
    operation: &'a AsyncOperation,
    channel: &'a Channel,
    document: &'a AsyncApiDocument,
) -> Result<Message> {
    if let Some(message_ref) = &operation.message {
        return resolve_message_ref(message_ref, document);
    }

    if let Some(message_ref) = operation.messages.first() {
        return resolve_message_ref(message_ref, document);
    }

    if let Some((_, message_ref)) = channel.messages.iter().next() {
        return resolve_message_ref(message_ref, document);
    }

    let inferred = infer_message_name(operation_name);
    if let Some(message) = document.messages.get(&inferred) {
        return Ok(message.clone());
    }

    if let Some(message) = document.messages.get(operation_name) {
        return Ok(message.clone());
    }

    if document.messages.len() == 1 {
        return Ok(document
            .messages
            .values()
            .next()
            .expect("checked len")
            .clone());
    }

    Err(Error::MissingOperationMessage(operation_name.to_string()))
}

fn resolve_message_ref(
    message_ref: &RefOr<Message>,
    document: &AsyncApiDocument,
) -> Result<Message> {
    match message_ref {
        RefOr::Ref { reference } => {
            let name = ref_name(reference, "#/messages/")?;
            document
                .messages
                .get(&name)
                .cloned()
                .ok_or(Error::MissingMessage(name))
        }
        RefOr::Value(message) => Ok(message.clone()),
    }
}

fn infer_message_name(operation_name: &str) -> String {
    for prefix in ["send", "receive", "publish", "subscribe"] {
        if let Some(rest) = operation_name.strip_prefix(prefix) {
            return to_camel_case(rest);
        }
    }

    to_camel_case(operation_name)
}

fn mqtt_qos(bindings: Option<&Value>) -> Option<u8> {
    bindings?
        .get("mqtt")?
        .get("qos")
        .and_then(|qos| qos.as_u64())
        .and_then(|qos| u8::try_from(qos).ok())
        .filter(|qos| *qos <= 2)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_topic_parameters_in_order() {
        assert_eq!(
            extract_topic_parameters("drones/{droneId}/missions/{missionId}/telemetry/{droneId}"),
            vec!["droneId".to_string(), "missionId".to_string()]
        );
    }
}
