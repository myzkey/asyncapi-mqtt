#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

const roots = ["src", "test", "scripts"];
const files = (await Promise.all(roots.map((root) => collectFiles(root)))).flat();

let failed = false;
for (const file of files) {
  const contents = await readFile(join(cwd(), file), "utf8");
  const lines = contents.split("\n");
  lines.forEach((line, index) => {
    if (/[ \t]$/.test(line)) {
      console.error(`${file}:${index + 1}: trailing whitespace`);
      failed = true;
    }
  });
}

if (failed) {
  process.exit(1);
}

async function collectFiles(dir) {
  const entries = await readdir(join(cwd(), dir), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(relativePath)));
    } else if (/\.(ts|js)$/.test(entry.name)) {
      files.push(relativePath);
    }
  }
  return files;
}
