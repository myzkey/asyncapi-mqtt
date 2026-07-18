use std::{fs, path::PathBuf};

use clap::{Parser, Subcommand};

use crate::{
    error::{Error, Result},
    generator::typescript::TypeScriptGenerator,
    ir::ClientSpec,
    parser::parse_asyncapi,
};

#[derive(Debug, Parser)]
#[command(name = "asyncapi-mqtt")]
#[command(about = "Generate type-safe TypeScript MQTT clients from AsyncAPI")]
pub struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    Generate {
        input: PathBuf,
        #[arg(short, long, default_value = "generated")]
        output: PathBuf,
    },
}

pub fn run() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Generate { input, output } => generate(input, output),
    }
}

fn generate(input: PathBuf, output: PathBuf) -> Result<()> {
    let contents = fs::read_to_string(&input).map_err(|source| Error::ReadFile {
        path: input,
        source,
    })?;
    let document = parse_asyncapi(&contents)?;
    let spec = ClientSpec::from_document(&document)?;
    TypeScriptGenerator::write(&spec, &output)
}
