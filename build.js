// build.js
const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["src/index.js"],
  bundle: true,
  minify: true,
  outfile: "dist/nexora-sdk.min.js",
  format: "iife",
  globalName: "nexora_sdk",
  sourcemap: false,
  target: ["es2017"]
}).then(() => {
  console.log("✅ SDK build completed: dist/nexora-sdk.min.js");
}).catch(() => process.exit(1));
