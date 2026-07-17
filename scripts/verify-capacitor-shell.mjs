import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(".output/public/index.html", "utf8");
console.log("has_tsr", html.includes("$_TSR"));
console.log("has_boot", html.includes("netro-static-boot"));
console.log("has_module", /assets\/index-[^"']+\.js/.test(html));

const assets = fs.readdirSync(".output/public/assets");
const js = assets.find((n) => n.startsWith("index-") && n.endsWith(".js"));
const s = fs.readFileSync(path.join(".output/public/assets", js), "utf8");
console.log("client_entry", js);
console.log("has_root_match", s.includes("__root__"));
console.log("has_boot_error", s.includes("netro-boot-error"));
console.log("has_supabase_url", s.includes("example.supabase.co"));
