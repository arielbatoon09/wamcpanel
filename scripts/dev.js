import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// 1. Parse root .env file manually (so we don't depend on npm-installed packages at root level)
const envFile = path.join(rootDir, ".env");
const localEnv = {};
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, "utf-8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const firstEq = trimmed.indexOf("=");
    if (firstEq === -1) return;
    const key = trimmed.slice(0, firstEq).trim();
    let val = trimmed.slice(firstEq + 1).trim();
    // Strip surrounding quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    localEnv[key] = val;
  });
}

// 2. Start PostgreSQL and Redis via Docker Compose
console.log("Starting backend services (PostgreSQL, Redis) in Docker...");
const compose = spawn("docker", ["compose", "up", "pg", "redis", "-d"], {
  stdio: "inherit",
  shell: true,
  cwd: rootDir,
});

compose.on("close", (code) => {
  if (code !== 0) {
    console.warn("Warning: Failed to start docker-compose services. Attempting to proceed anyway...");
  }

  // Build target child environments
  const childEnv = {
    ...process.env,
    ...localEnv,
    NEXT_PUBLIC_BACKEND_URL: localEnv.NEXT_PUBLIC_BACKEND_URL || `http://localhost:${localEnv.BACKEND_PORT || 8000}`,
  };

  // 3. Start Backend
  console.log("Launching Backend Dev Server...");
  const backend = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
    cwd: path.join(rootDir, "backend"),
    env: childEnv,
  });

  // 4. Start Frontend
  console.log("Launching Frontend Dev Server...");
  const frontend = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
    cwd: path.join(rootDir, "frontend"),
    env: childEnv,
  });

  // Handle cleanup on process termination
  const cleanup = () => {
    console.log("\nShutting down dev servers...");
    backend.kill();
    frontend.kill();
    process.exit();
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
});
