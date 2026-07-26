import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
