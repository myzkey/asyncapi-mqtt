import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";
import { basicYaml } from "./fixtures/documents.js";

function memoryIo() {
  let stdout = "";
  let stderr = "";
  return {
    io: {
      stdout: { write: (chunk: string) => void (stdout += chunk) },
      stderr: { write: (chunk: string) => void (stderr += chunk) },
    },
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
  };
}

describe("cli", () => {
  it("prints help", async () => {
    const output = memoryIo();
    await expect(runCli(["--help"], output.io)).resolves.toBe(0);
    expect(output.stdout).toContain("Usage:");
  });

  it("generates into the default output directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "asyncapi-mqtt-cli-"));
    const input = join(dir, "asyncapi.yaml");
    await writeFile(input, basicYaml);

    const output = memoryIo();
    const previousCwd = process.cwd();
    process.chdir(dir);
    try {
      await expect(runCli(["generate", input], output.io)).resolves.toBe(0);
      await expect(readFile(join(dir, "generated/client.ts"), "utf8")).resolves.toContain("sendTelemetry");
      await expect(readFile(join(dir, "generated/types.ts"), "utf8")).resolves.toContain("SendTelemetryPayload");
    } finally {
      process.chdir(previousCwd);
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("honors --output", async () => {
    const dir = await mkdtemp(join(tmpdir(), "asyncapi-mqtt-cli-output-"));
    const input = join(dir, "asyncapi.yaml");
    const outputDir = join(dir, "custom");
    await writeFile(input, basicYaml);

    const output = memoryIo();
    await expect(runCli(["generate", input, "--output", outputDir], output.io)).resolves.toBe(0);
    await expect(readFile(join(outputDir, "client.ts"), "utf8")).resolves.toContain("sendTelemetry");
    await rm(dir, { recursive: true, force: true });
  });

  it("returns non-zero and writes errors to stderr", async () => {
    const output = memoryIo();
    await expect(runCli(["generate", "/tmp/asyncapi-mqtt-does-not-exist.yaml"], output.io)).resolves.toBe(1);
    expect(output.stderr).toContain("error:");
  });
});
