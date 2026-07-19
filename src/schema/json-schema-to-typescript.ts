import type { JsonSchema } from "../model/asyncapi.js";
import { isRecord } from "../model/asyncapi.js";
import { toPascalCase } from "../utils/case.js";

export function jsonSchemaToTypeScript(schema: JsonSchema, indent = 0): string {
  const reference = typeof schema.$ref === "string" ? schema.$ref : undefined;
  if (reference?.startsWith("#/messages/")) {
    return `${toPascalCase(reference.slice("#/messages/".length))}Payload`;
  }

  switch (schema.type) {
    case "object":
      return objectSchemaToTypeScript(schema, indent);
    case "array":
      return `${jsonSchemaToTypeScript(asSchema(schema.items), indent)}[]`;
    case "string":
      return stringSchemaToTypeScript(schema);
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    default:
      return "unknown";
  }
}

export function normalizeSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map(normalizeSchema);
  }

  if (isRecord(schema)) {
    return Object.fromEntries(Object.entries(schema).map(([key, value]) => [key, normalizeSchema(value)]));
  }

  return schema ?? {};
}

function objectSchemaToTypeScript(schema: JsonSchema, indent: number): string {
  const properties = isRecord(schema.properties) ? schema.properties : undefined;
  if (!properties) {
    return "Record<string, unknown>";
  }

  const required = Array.isArray(schema.required)
    ? new Set(schema.required.filter((value): value is string => typeof value === "string"))
    : new Set<string>();
  const base = " ".repeat(indent);
  const child = " ".repeat(indent + 2);
  const fields = Object.entries(properties).map(([name, propertySchema]) => {
    const optional = required.has(name) ? "" : "?";
    return `${child}${quotePropertyName(name)}${optional}: ${jsonSchemaToTypeScript(asSchema(propertySchema), indent + 2)};`;
  });

  return `{\n${fields.join("\n")}\n${base}}`;
}

function stringSchemaToTypeScript(schema: JsonSchema): string {
  const variants = Array.isArray(schema.enum)
    ? schema.enum.filter((value): value is string => typeof value === "string").map((value) => JSON.stringify(value))
    : [];

  return variants.length > 0 ? variants.join(" | ") : "string";
}

function quotePropertyName(name: string): string {
  return /^[$A-Z_a-z][$\w]*$/.test(name) ? name : JSON.stringify(name);
}

function asSchema(value: unknown): JsonSchema {
  return isRecord(value) ? value : {};
}
