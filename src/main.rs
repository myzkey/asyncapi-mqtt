fn main() {
    if let Err(error) = asyncapi_mqtt::cli::run() {
        eprintln!("error: {error}");
        std::process::exit(1);
    }
}
