import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

export const authConfig = {
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "development-secret-key-change-in-production",
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/resident",
  },
  providers: [],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const target = new URL(url);
        if (target.origin === baseUrl) return url;
      } catch {
        return baseUrl;
      }
      return baseUrl;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: UserRole }).role ?? "RESIDENT";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole) ?? "RESIDENT";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
