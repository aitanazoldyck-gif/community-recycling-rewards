import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";
import { loginSchema } from "@/lib/validators/auth";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findFirst({
          where: {
            email: parsed.data.email.toLowerCase(),
            deletedAt: null,
            isActive: true,
          },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: UserRole }).role ?? "RESIDENT";
      }

      if (trigger === "update" && session?.role) {
        token.role = session.role as UserRole;
      }

      if (token.id && !token.role) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "RESIDENT";
      }

      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (existing && !existing.isActive) return false;

        if (existing && !existing.emailVerified) {
          await db.user.update({
            where: { id: existing.id },
            data: { emailVerified: new Date() },
          });
        }

        if (!existing) {
          const created = await db.user.create({
            data: {
              email: user.email.toLowerCase(),
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
              role: "RESIDENT",
            },
          });
          await db.residentProfile.create({
            data: { userId: created.id },
          });
          await db.rewardWallet.create({
            data: { residentId: created.id },
          });
        }
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const profile = await db.residentProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) {
        await db.residentProfile.create({ data: { userId: user.id } });
        await db.rewardWallet.create({ data: { residentId: user.id } });
      }
    },
  },
});
