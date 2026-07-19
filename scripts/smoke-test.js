#!/usr/bin/env node
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const tempDir = await mkdtemp(join(tmpdir(), "asyncapi-mqtt-smoke-"));

try {
  execFileSync("pnpm", ["pack", "--pack-destination", tempDir], { cwd: repoRoot, stdio: "inherit" });
  const tarball = join(tempDir, `asyncapi-mqtt-${packageJson.version}.tgz`);
  const appDir = join(tempDir, "app");
  await import("node:fs/promises").then(({ mkdir }) => mkdir(appDir));
  execFileSync("npm", ["init", "-y"], { cwd: appDir, stdio: "ignore" });
  execFileSync("npm", ["install", "--save-dev", tarball], { cwd: appDir, stdio: "inherit" });
  execFileSync("npx", ["asyncapi-mqtt", "--help"], { cwd: appDir, stdio: "inherit" });
  execFileSync("npx", ["asyncapi-mqtt", "generate", join(repoRoot, "examples/basic/asyncapi.yaml")], {
    cwd: appDir,
    stdio: "inherit",
  });
  execFileSync("npm", ["install", "mqtt", "ajv"], { cwd: appDir, stdio: "inherit" });
  execFileSync("npm", ["install", "--save-dev", "typescript", "@types/node"], { cwd: appDir, stdio: "inherit" });
  await writeFile(
    join(appDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          skipLibCheck: true,
          types: ["node"],
        },
        include: ["generated/**/*.ts"],
      },
      null,
      2,
    ),
  );
  execFileSync("npx", ["tsc", "--noEmit"], { cwd: appDir, stdio: "inherit" });
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
