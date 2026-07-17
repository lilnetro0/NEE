import fs from "node:fs";
import path from "node:path";

/**
 * Capacitor needs webDir/index.html.
 *
 * TanStack Start + Nitro does not emit a static SPA index.html (SSR HTML is
 * server-generated; official spa.prerender fails with Nitro's `.output` layout).
 *
 * This script writes a Capacitor-safe shell that:
 * 1. Shows a visible boot UI (never a blank black screen)
 * 2. Injects window.$_TSR SPA bootstrap required by Start's hydrateStart()
 * 3. Loads the hashed client entry + CSS with relative paths
 * 4. Surfaces script load failures in the WebView
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

const tsrBootstrap = `(function(){var g=typeof self!=="undefined"?self:window;g.$_TSR=g.$_TSR||{h:function(){this.hydrated=true;this.c()},e:function(){this.streamEnded=true;this.c()},c:function(){},p:function(s){!this.initialized?this.buffer.push(s):s()},buffer:[]};if(!g.$_TSR.router){g.$_TSR.router={manifest:void 0,matches:[{i:"__root__",u:Date.now(),s:"success",ssr:true}],lastMatchId:"__root__"};}g.$_TSR.streamEnded=true;})();`;

const bootCss = [
  "html,body{margin:0;min-height:100%;background:#0d0f1a;color:#f4f6fb;font-family:system-ui,-apple-system,Segoe UI,sans-serif}",
  "#netro-static-boot{min-height:100dvh;display:grid;place-items:center;padding:24px;box-sizing:border-box;text-align:center}",
  "#netro-static-boot .mark{width:72px;height:72px;border-radius:22px;display:grid;place-items:center;margin:0 auto 16px;font-weight:900;font-size:32px;color:#fff;background:linear-gradient(135deg,#3b82f6,#8b5cf6)}",
  "#netro-static-boot h1{margin:0;font-size:1.75rem;font-weight:900;letter-spacing:-0.03em}",
  "#netro-static-boot p{margin:8px 0 0;font-size:0.875rem;color:#a8b0c2}",
  "#netro-static-boot .dots{margin-top:28px;display:flex;gap:6px;justify-content:center}",
  "#netro-static-boot .dots span{width:8px;height:8px;border-radius:999px;background:#3b82f6;opacity:0.35;animation:netroPulse 1s infinite ease-in-out}",
  "#netro-static-boot .dots span:nth-child(2){animation-delay:0.15s}",
  "#netro-static-boot .dots span:nth-child(3){animation-delay:0.3s}",
  "@keyframes netroPulse{0%,100%{opacity:0.25;transform:scale(0.9)}50%{opacity:1;transform:scale(1)}}",
].join("");

const lines = [
  "<!doctype html>",
  '<html lang="en" class="dark" data-netro-shell="capacitor">',
  "  <head>",
  '    <meta charset="utf-8" />',
  '    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />',
  '    <meta name="theme-color" content="#0d0f1a" />',
  '    <meta name="color-scheme" content="dark" />',
  "    <title>NETRO</title>",
  "    <style>" + bootCss + "</style>",
  '    <link rel="manifest" href="./manifest.webmanifest" />',
  '    <link rel="icon" href="./favicon.ico" type="image/x-icon" />',
];

if (stylesCss) {
  lines.push('    <link rel="stylesheet" href="./assets/' + stylesCss + '" />');
}

lines.push(
  "  </head>",
  "  <body>",
  '    <div id="netro-static-boot">',
  '      <div>',
  '        <div class="mark" aria-hidden="true">N</div>',
  "        <h1>NETRO</h1>",
  "        <p>Starting…</p>",
  '        <div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>',
  "      </div>",
  "    </div>",
  "    <script>" + tsrBootstrap + "</script>",
  '    <script>',
  "      window.addEventListener('error', function (e) {",
  "        var el = document.getElementById('netro-static-boot');",
  "        if (!el) return;",
  "        var msg = (e && e.message) ? e.message : 'A startup error occurred.';",
  "        el.innerHTML = '<div><div class=\"mark\">N</div><h1>NETRO failed to start</h1><p>' + String(msg).replace(/</g,'&lt;') + '</p></div>';",
  "      });",
  "      window.addEventListener('unhandledrejection', function (e) {",
  "        var el = document.getElementById('netro-static-boot');",
  "        if (!el) return;",
  "        var r = e && e.reason;",
  "        var msg = r && r.message ? r.message : String(r || 'Unhandled promise rejection');",
  "        el.innerHTML = '<div><div class=\"mark\">N</div><h1>NETRO failed to start</h1><p>' + String(msg).replace(/</g,'&lt;') + '</p></div>';",
  "      });",
  "    </script>",
  '    <script type="module" src="./assets/' +
    indexJs +
    '" onerror="var el=document.getElementById(\'netro-static-boot\');if(el){el.innerHTML=\'<div><div class=mark>N</div><h1>NETRO failed to start</h1><p>Could not load the app bundle. Rebuild and run cap sync.</p></div>\';}"></script>',
  "  </body>",
  "</html>",
  "",
);

const outFile = path.join(publicDir, "index.html");
fs.writeFileSync(outFile, lines.join("\n"), "utf8");
console.log("prepare-capacitor: wrote .output/public/index.html -> assets/" + indexJs);

// Soft check: production Capacitor builds must inline Supabase public env.
const assetJs = assetFiles.filter((name) => name.endsWith(".js"));
const hasSupabaseUrl = assetJs.some((name) =>
  fs.readFileSync(path.join(assetsDir, name), "utf8").includes("supabase.co"),
);
if (!hasSupabaseUrl) {
  console.warn(
    "prepare-capacitor: WARNING — no supabase.co URL found in client assets. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before npm run build, " +
      "or TestFlight will show a configuration error screen.",
  );
}
