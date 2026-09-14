/** Public app URL used for authentication links and redirects. */
export function getAppUrl(request?: Request) {
  const configuredUrl = process.env.NEXTAUTH_URL?.trim();

  if (
    configuredUrl &&
    !configuredUrl.includes("your-app.up.railway.app") &&
    !configuredUrl.includes("onrender.com")
  ) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") ?? "https";
    if (host) return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}
