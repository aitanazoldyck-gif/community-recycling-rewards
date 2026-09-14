import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const setup = spawnSync(process.execPath, ["scripts/setup-db.mjs"], {
  stdio: "inherit",
  env: process.env,
});

if (setup.status !== 0) {
  console.warn("[start] Database setup did not complete. Starting the web server anyway.");
}

const nextCommand = process.platform === "win32" ? "next.cmd" : "next";
const next = spawn(nextCommand, ["start", "-H", "0.0.0.0"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    PORT: process.env.PORT || "10000",
  },
});

next.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

next.on("error", (error) => {
  console.error("[start] Unable to start Next.js:", error);
  process.exit(1);
});
