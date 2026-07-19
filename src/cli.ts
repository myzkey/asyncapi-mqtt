import { parseArgs } from "node:util";
import { AsyncApiMqttError } from "./errors.js";
import { writeGeneratedFiles } from "./generator/write-generated-files.js";
import { parseDocumentFile } from "./parser/parse-document.js";
import { toClientSpec } from "./resolver/to-client-spec.js";

export type CliIO = {
  stdout: { write(chunk: string): unknown };
  stderr: { write(chunk: string): unknown };
};

const HELP = `asyncapi-mqtt

Generate type-safe TypeScript MQTT clients from AsyncAPI.

Usage:
  asyncapi-mqtt generate <asyncapi.yaml> [--output <dir>]
  asyncapi-mqtt --help

Commands:
  generate    Generate generated/client.ts and generated/types.ts

Options:
  -o, --output <dir>  Output directory (default: generated)
  -h, --help          Show help
`;

export async function runCli(argv = process.argv.slice(2), io: CliIO = process): Promise<number> {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    io.stdout.write(HELP);
    return 0;
  }

  const [command, ...rest] = argv;
  if (command !== "generate") {
    io.stderr.write(`Unknown command: ${command}\n\n${HELP}`);
    return 1;
  }

  try {
    const { positionals, values } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: {
        output: { type: "string", short: "o", default: "generated" },
      },
    });
    const input = positionals[0];
    if (!input) {
      throw new AsyncApiMqttError("Missing input file");
    }

    const document = await parseDocumentFile(input);
    const spec = toClientSpec(document);
    await writeGeneratedFiles(spec, values.output ?? "generated");
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr.write(`error: ${message}\n`);
    return 1;
  }
}

if (!process.env.VITEST) {
  process.exitCode = await runCli();
}
