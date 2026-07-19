#!/usr/bin/env node
import { readFileSync } from "node:fs";

const refName = process.env.GITHUB_REF_NAME;
if (!refName || !refName.startsWith("v")) {
  console.log("No v-prefixed release tag found; skipping release version check");
  process.exit(0);
}

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const tagVersion = refName.slice(1);

if (packageJson.version !== tagVersion) {
  console.error(`Release tag/version mismatch: tag ${refName}, package ${packageJson.version}`);
  process.exit(1);
}

console.log(`Release tag matches package version: ${tagVersion}`);
