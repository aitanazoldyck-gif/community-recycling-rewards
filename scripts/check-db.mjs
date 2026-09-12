import "dotenv/config";
import mariadb from "mariadb";

const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!url || url.includes("user:password@localhost")) {
  console.error("DATABASE_URL is missing or still uses the example localhost value.");
  console.error("Set DATABASE_URL in .env.local to a reachable MySQL or MariaDB URL.");
  process.exit(1);
}

const pool = mariadb.createPool({
  uri: url,
  max: 1,
  connectTimeout: 10000,
});

try {
  await pool.query("SELECT 1");
  console.log("Database connection successful.");

  const tables = await pool.query(`
    SELECT TABLE_NAME
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'User'
  `);

  if (tables.length === 0) {
    console.warn("Connected, but schema is missing. Run: npm run db:setup");
    process.exitCode = 1;
  } else {
    const users = await pool.query("SELECT COUNT(*) AS count FROM `User`");
    console.log(`User table exists with ${users[0].count} users.`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Database connection failed:", message);
  console.error("On Railway, reference the MySQL service's DATABASE_URL from the app service.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
