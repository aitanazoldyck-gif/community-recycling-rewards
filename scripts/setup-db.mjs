import { execSync } from "node:child_process";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!databaseUrl) {
  console.warn("[setup-db] DATABASE_URL is not set — skipping database setup.");
  process.exit(0);
}

if (databaseUrl.includes("user:password@localhost")) {
  console.warn("[setup-db] DATABASE_URL still uses the example localhost value — skipping.");
  process.exit(0);
}

try {
  const parsedUrl = new URL(databaseUrl);
  const placeholderParts = new Set([
    "USER",
    "PASSWORD",
    "HOST",
    "DATABASE",
    "your-user",
    "your-password",
    "your-host",
    "your-database",
    "actual_user",
    "actual_password",
    "actual_host",
    "actual_database",
  ]);
  const containsPlaceholder = [
    decodeURIComponent(parsedUrl.username),
    decodeURIComponent(parsedUrl.password),
    parsedUrl.hostname,
    parsedUrl.pathname.slice(1),
  ].some((part) => placeholderParts.has(part));

  if (containsPlaceholder) {
    console.error(
      "[setup-db] DATABASE_URL still contains placeholders. Replace USER, PASSWORD, HOST, and DATABASE with the real MySQL connection details from your database provider.",
    );
    process.exit(1);
  }
} catch {
  console.error(
    "[setup-db] DATABASE_URL is not a valid MySQL URL. Expected mysql://USER:PASSWORD@HOST:3306/DATABASE.",
  );
  process.exit(1);
}

console.log("[setup-db] Applying Prisma schema...");
// Prisma 7 does not accept --skip-generate in this command; schema generation
// already happens in the build step, so we only need to push the schema here.
try {
  execSync("npx prisma db push", {
    stdio: "inherit",
    env: process.env,
  });
} catch (error) {
  throw error;
}

console.log("[setup-db] Seeding demo data and users...");
execSync("npx tsx prisma/seed.ts", {
  stdio: "inherit",
  env: process.env,
});

console.log("[setup-db] Database ready.");
