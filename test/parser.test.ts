import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseDocument, parseDocumentFile } from "../src/parser/parse-document.js";
import { basicYaml } from "./fixtures/documents.js";

describe("parseDocument", () => {
  it("parses YAML documents", () => {
    expect(parseDocument(basicYaml).asyncapi).toBe("3.0.0");
  });

  it("parses JSON documents", () => {
    const document = parseDocument(
      JSON.stringify({
        asyncapi: "3.0.0",
        channels: {},
        operations: {},
        messages: {},
      }),
      "asyncapi.json",
    );

    expect(document.asyncapi).toBe("3.0.0");
  });

  it("fails for invalid documents", () => {
    expect(() => parseDocument("[]")).toThrow(/must be an object/);
  });

  it("fails for unsupported AsyncAPI versions", () => {
    expect(() => parseDocument("asyncapi: 2.6.0")).toThrow(/supports AsyncAPI 3.x/);
  });
});

describe("parseDocumentFile", () => {
  it("fails for missing files", async () => {
    await expect(parseDocumentFile("/tmp/asyncapi-mqtt-missing.yaml")).rejects.toThrow(/Failed to read/);
  });

  it("reads YAML from disk", async () => {
    const dir = await mkdtemp(join(tmpdir(), "asyncapi-mqtt-parser-"));
    await mkdir(dir, { recursive: true });
    const file = join(dir, "asyncapi.yaml");
    await writeFile(file, basicYaml);

    await expect(parseDocumentFile(file)).resolves.toMatchObject({ asyncapi: "3.0.0" });
  });
});
