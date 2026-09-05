import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUsers } from "@/lib/bootstrap-users";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    await ensureDemoUsers();

    const userCount = await db.user.count();

    return NextResponse.json({
      status: "ok",
      database: "connected",
      users: userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health]", error);
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        databaseConfigured: Boolean(process.env.DATABASE_URL || process.env.DIRECT_URL),
        reason: message.includes("DATABASE_URL")
          ? "DATABASE_URL is not configured"
          : "Database connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
