import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  document.body.innerHTML =
    '<div style="min-height:100vh;display:grid;place-items:center;background:#020617;color:#e2e8f0;font-family:system-ui">NETRO Admin failed to mount (#root missing)</div>';
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
