/**
 * Resolves a PostgreSQL connection string for the `pg` driver.
 * Prisma CLI accepts `prisma+postgres://` URLs, but node-postgres needs `postgres://`.
 */
export function resolvePgConnectionString(
  url = process.env.DATABASE_URL
): string | undefined {
  if (!url) return undefined;

  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return url;
  }

  if (url.startsWith("prisma+postgres://")) {
    try {
      const apiKey = new URL(url).searchParams.get("api_key");
      if (apiKey) {
        const payloadSegment = apiKey.split(".")[1];
        if (payloadSegment) {
          const payload = JSON.parse(
            Buffer.from(payloadSegment, "base64url").toString("utf8")
          ) as { databaseUrl?: string };
          if (payload.databaseUrl) return payload.databaseUrl;
        }
      }
    } catch {
      // fall through to DIRECT_URL / raw url
    }
  }

  return process.env.DIRECT_URL ?? url;
}
