import "dotenv/config";
import pg from "pg";

const url = process.env.DATABASE_URL;

if (!url || url.includes("user:password@localhost")) {
  console.error("DATABASE_URL is missing or still uses the example localhost value.");
  console.error("Set DATABASE_URL in .env.local to a running PostgreSQL database.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 5000 });

try {
  await pool.query("SELECT 1");
  console.log("Database connection successful.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Database connection failed:", message);
  console.error("Check that PostgreSQL is running and DATABASE_URL is correct.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
