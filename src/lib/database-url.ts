/** Resolves the MySQL connection string used by Prisma and the MariaDB driver. */
export function resolveMySqlConnectionString(
  url = process.env.DATABASE_URL
): string | undefined {
  if (url?.startsWith("mysql://") || url?.startsWith("mariadb://")) {
    return url;
  }

  return process.env.DIRECT_URL;
}
