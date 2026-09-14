import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";
import { db } from "@/lib/db";

const schema = z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().max(1000).optional(), price: z.number().nonnegative(), imageUrls: z.array(z.string().max(2_000_000)).max(6).default([]) });

export async function GET() {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  const listings = await db.marketplaceListing.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 40, include: { seller: { select: { id: true, name: true, image: true } } } });
  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  try {
    const data = schema.parse(await request.json());
    const listing = await db.marketplaceListing.create({ data: { ...data, sellerId: result.session.user.id }, include: { seller: { select: { id: true, name: true, image: true } } } });
    return NextResponse.json(listing, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to publish listing." }, { status: 400 }); }
}
