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
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
