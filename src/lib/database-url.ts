/** Resolves the MySQL connection string used by Prisma and the MariaDB driver. */
export function resolveMySqlConnectionString(
  url = process.env.DATABASE_URL
): string | undefined {
  if (url?.startsWith("mysql://") || url?.startsWith("mariadb://")) {
    return url;
  }

  if (process.env.DIRECT_URL?.startsWith("mysql://") || process.env.DIRECT_URL?.startsWith("mariadb://")) {
    return process.env.DIRECT_URL;
  }

  const host = process.env.MYSQLHOST;
  const user = process.env.MYSQLUSER;
  const password = process.env.MYSQLPASSWORD;
  const database = process.env.MYSQLDATABASE ?? process.env.MYSQL_DATABASE;
  const port = process.env.MYSQLPORT ?? "3306";
  if (!host || !user || !password || !database) return undefined;

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}
