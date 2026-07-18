use std::path::PathBuf;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("failed to read {path}: {source}")]
    ReadFile {
        path: PathBuf,
        source: std::io::Error,
    },
    #[error("failed to write {path}: {source}")]
    WriteFile {
        path: PathBuf,
        source: std::io::Error,
    },
    #[error("failed to create directory {path}: {source}")]
    CreateDir {
        path: PathBuf,
        source: std::io::Error,
    },
    #[error("failed to parse AsyncAPI YAML: {0}")]
    ParseYaml(#[from] serde_yaml::Error),
    #[error("failed to convert AsyncAPI document: {0}")]
    ParseJson(#[from] serde_json::Error),
    #[error("unsupported AsyncAPI version `{0}`; asyncapi-mqtt currently supports AsyncAPI 3.x")]
    UnsupportedAsyncApiVersion(String),
    #[error("missing channel `{0}`")]
    MissingChannel(String),
    #[error("missing message `{0}`")]
    MissingMessage(String),
    #[error("operation `{0}` is missing a channel reference")]
    MissingOperationChannel(String),
    #[error("operation `{0}` has unsupported action `{1}`")]
    UnsupportedOperationAction(String, String),
    #[error("unsupported reference `{0}`")]
    UnsupportedReference(String),
    #[error("operation `{0}` has no resolvable payload message")]
    MissingOperationMessage(String),
}

pub type Result<T> = std::result::Result<T, Error>;
