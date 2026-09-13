/** Public app URL used for authentication links and redirects. */
export function getAppUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
