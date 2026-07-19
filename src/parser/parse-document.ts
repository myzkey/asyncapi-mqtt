import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { AsyncApiMqttError } from "../errors.js";
import type { AsyncApiDocument } from "../model/asyncapi.js";
import { isRecord } from "../model/asyncapi.js";

export async function parseDocumentFile(filePath: string): Promise<AsyncApiDocument> {
  let contents: string;
  try {
    contents = await readFile(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AsyncApiMqttError(`Failed to read ${filePath}: ${message}`);
  }

  return parseDocument(contents, filePath);
}

export function parseDocument(contents: string, sourceName = "AsyncAPI document"): AsyncApiDocument {
  let value: unknown;

  try {
    value = sourceName.endsWith(".json") ? JSON.parse(contents) : parseYaml(contents);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AsyncApiMqttError(`Failed to parse ${sourceName}: ${message}`);
  }

  if (!isRecord(value)) {
    throw new AsyncApiMqttError(`${sourceName} must be an object`);
  }

  if (typeof value.asyncapi !== "string") {
    throw new AsyncApiMqttError(`${sourceName} is missing asyncapi version`);
  }

  if (!value.asyncapi.startsWith("3.")) {
    throw new AsyncApiMqttError(
      `Unsupported AsyncAPI version ${value.asyncapi}; asyncapi-mqtt currently supports AsyncAPI 3.x`,
    );
  }

  return value as AsyncApiDocument;
}
