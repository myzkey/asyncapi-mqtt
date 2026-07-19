import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  dts: false,
  sourcemap: false,
  splitting: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
