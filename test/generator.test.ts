import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { generateClient } from "../src/generator/generate-client.js";
import { generateTypes } from "../src/generator/generate-types.js";
import { writeGeneratedFiles } from "../src/generator/write-generated-files.js";
import { parseDocument } from "../src/parser/parse-document.js";
import { toClientSpec } from "../src/resolver/to-client-spec.js";
import { droneYaml } from "./fixtures/documents.js";

describe("generator", () => {
  const spec = toClientSpec(parseDocument(droneYaml));

  it("generates types.ts content", () => {
    const output = generateTypes(spec);
    expect(output).toContain("export type SendTelemetryPayload");
    expect(output).toContain("droneId: string | number | boolean;");
    expect(output).toContain("latitude: number;");
    expect(output).toContain("meta?: {");
    expect(output).toContain("status: string;");
    expect(output).toContain('command: "takeoff" | "land";');
  });

  it("generates client.ts content", () => {
    const output = generateClient(spec);
    expect(output).toContain("async sendTelemetry(");
    expect(output).toContain("receiveCommand(");
    expect(output).toContain('buildTopic("drones/{droneId}/telemetry", params)');
    expect(output).toContain("new Ajv()");
    expect(output).toContain("validate?: boolean");
    expect(output).toContain("ajv?: Ajv");
    expect(output).toContain("{ qos: 2, ...options }");
    expect(output).toContain("{ qos: 1, ...options }");
  });

  it("writes client.ts and types.ts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "asyncapi-mqtt-generator-"));

    await writeGeneratedFiles(spec, dir);

    await expect(readFile(join(dir, "client.ts"), "utf8")).resolves.toContain("createClient");
    await expect(readFile(join(dir, "types.ts"), "utf8")).resolves.toContain("ReceiveCommandPayload");
    await rm(dir, { recursive: true, force: true });
  });
});
