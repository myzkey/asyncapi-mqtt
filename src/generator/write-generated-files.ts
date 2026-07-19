import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ClientSpec } from "../model/ir.js";
import { generateClient } from "./generate-client.js";
import { generateTypes } from "./generate-types.js";

export async function writeGeneratedFiles(spec: ClientSpec, outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "client.ts"), generateClient(spec));
  await writeFile(join(outputDir, "types.ts"), generateTypes(spec));
}
