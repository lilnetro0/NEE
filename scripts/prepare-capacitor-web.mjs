import fs from "node:fs";
import path from "node:path";

/**
 * Capacitor needs webDir/index.html.
 * Writes index.html into `.output/public` (no directory copy — avoids a Node
 * crash on some Windows/OneDrive paths when recursively copying assets).
 */

const root = process.cwd();
const publicDir = path.join(root, ".output", "public");
const assetsDir = path.join(publicDir, "assets");

console.log("prepare-capacitor: start");

if (!fs.existsSync(assetsDir)) {
  console.error("Missing .output/public/assets. Run npm run build first.");
  process.exit(1);
}

const assetFiles = fs.readdirSync(assetsDir);
const indexJs = assetFiles.find((name) => name.startsWith("index-") && name.endsWith(".js"));
const stylesCss = assetFiles.find((name) => name.startsWith("styles-") && name.endsWith(".css"));

if (!indexJs) {
  console.error("Could not find assets/index-*.js");
  process.exit(1);
}

const lines = [
  "<!doctype html>",
  '<html lang="en" class="dark">',
  "  <head>",
  '    <meta charset="utf-8" />',
  '    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />',
  '    <meta name="theme-color" content="#0d0f1a" />',
  "    <title>NETRO</title>",
  '    <link rel="manifest" href="./manifest.webmanifest" />',
  '    <link rel="icon" href="./favicon.ico" type="image/x-icon" />',
];

if (stylesCss) {
  lines.push('    <link rel="stylesheet" href="./assets/' + stylesCss + '" />');
}

lines.push(
  "  </head>",
  "  <body>",
  '    <script type="module" src="./assets/' + indexJs + '"></script>',
  "  </body>",
  "</html>",
  "",
);

const outFile = path.join(publicDir, "index.html");
fs.writeFileSync(outFile, lines.join("\n"), "utf8");
console.log("prepare-capacitor: wrote .output/public/index.html -> assets/" + indexJs);
