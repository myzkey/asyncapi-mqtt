use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

fn unique_temp_dir() -> PathBuf {
    let suffix = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time should be after unix epoch")
        .as_nanos();
    std::env::temp_dir().join(format!(
        "asyncapi-mqtt-test-{}-{suffix}",
        std::process::id()
    ))
}

fn write_file(path: &Path, contents: &str) {
    fs::write(path, contents).unwrap_or_else(|error| {
        panic!("failed to write {}: {error}", path.display());
    });
}

#[test]
fn generate_writes_client_and_types_files() {
    let temp_dir = unique_temp_dir();
    fs::create_dir_all(&temp_dir).expect("temp dir should be created");

    let input_path = temp_dir.join("asyncapi.yaml");
    let output_dir = temp_dir.join("generated");
    write_file(
        &input_path,
        r##"
asyncapi: 3.0.0
channels:
  telemetry:
    address: drones/{droneId}/telemetry
operations:
  sendTelemetry:
    action: send
    channel:
      $ref: '#/channels/telemetry'
messages:
  telemetry:
    payload:
      type: object
      required:
        - latitude
      properties:
        latitude:
          type: number
"##,
    );

    let output = Command::new(env!("CARGO_BIN_EXE_asyncapi-mqtt"))
        .arg("generate")
        .arg(&input_path)
        .arg("--output")
        .arg(&output_dir)
        .output()
        .expect("command should run");

    assert!(
        output.status.success(),
        "command failed\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let client = fs::read_to_string(output_dir.join("client.ts")).expect("client.ts should exist");
    let types = fs::read_to_string(output_dir.join("types.ts")).expect("types.ts should exist");

    assert!(client.contains("export function createClient"));
    assert!(client.contains("async sendTelemetry("));
    assert!(client.contains("buildTopic(\"drones/{droneId}/telemetry\", params)"));
    assert!(types.contains("export type SendTelemetryPayload"));
    assert!(types.contains("latitude: number;"));

    fs::remove_dir_all(temp_dir).expect("temp dir should be removed");
}

#[test]
fn generate_returns_error_for_non_asyncapi_3_documents() {
    let temp_dir = unique_temp_dir();
    fs::create_dir_all(&temp_dir).expect("temp dir should be created");

    let input_path = temp_dir.join("asyncapi.yaml");
    let output_dir = temp_dir.join("generated");
    write_file(
        &input_path,
        r#"
asyncapi: 2.6.0
channels: {}
operations: {}
messages: {}
"#,
    );

    let output = Command::new(env!("CARGO_BIN_EXE_asyncapi-mqtt"))
        .arg("generate")
        .arg(&input_path)
        .arg("--output")
        .arg(&output_dir)
        .output()
        .expect("command should run");

    assert!(!output.status.success());
    assert!(
        String::from_utf8_lossy(&output.stderr).contains("supports AsyncAPI 3.x"),
        "stderr was: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(!output_dir.exists());

    fs::remove_dir_all(temp_dir).expect("temp dir should be removed");
}
