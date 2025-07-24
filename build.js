// build.js
const esbuild = require("esbuild");
const buildNumber = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 12); 
esbuild.build({
  entryPoints: ["src/index.js"],
  bundle: true,
  minify: true,
  outfile: "dist/nexora-sdk.min.js",
  format: "iife",
  globalName: "nexora_sdk",
  sourcemap: false,
  target: ["es2017"],
  define: {
    'process.env.BUILD_NUMBER': JSON.stringify(buildNumber),
  },
}).then(() => {
  console.log("✅ SDK build completed: dist/nexora-sdk.min.js");
}).catch(() => process.exit(1));
