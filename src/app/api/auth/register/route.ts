import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators/auth";
import {
  sendEmail,
  verificationEmailHtml,
} from "@/lib/email";
import { APP_NAME } from "@/lib/constants";
import { getAppUrl } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role: "RESIDENT",
        emailVerificationTokens: {
          create: { token, expires },
        },
        residentProfile: {
          create: {
            wallet: { create: {} },
          },
        },
      },
    });

    const baseUrl = getAppUrl();
    const verifyLink = `${baseUrl}/verify-email?token=${token}`;

    await sendEmail({
      to: normalizedEmail,
      subject: `Verify your ${APP_NAME} account`,
      html: verificationEmailHtml(name, verifyLink),
    });

    return NextResponse.json(
      {
        message: "Account created. Please check your email to verify your account.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
