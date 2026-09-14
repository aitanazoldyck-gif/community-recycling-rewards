import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getFriendIds, isValidMediaUrl } from "@/lib/social";

const storySchema = z.object({ body: z.string().trim().max(500).optional(), mediaUrl: z.string().max(2_000_000).optional() });

export async function GET() {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  const stories = await db.socialStory.findMany({
    where: { authorId: { in: await getFriendIds(result.session.user.id) }, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(stories);
}

export async function POST(request: Request) {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  try {
    const data = storySchema.parse(await request.json());
    if (!data.body && !data.mediaUrl) return NextResponse.json({ error: "Add text or media to your story." }, { status: 400 });
    if (data.mediaUrl && !isValidMediaUrl(data.mediaUrl)) return NextResponse.json({ error: "Invalid story media." }, { status: 400 });
    const story = await db.socialStory.create({
      data: { authorId: result.session.user.id, body: data.body || null, mediaUrl: data.mediaUrl || null, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      include: { author: { select: { id: true, name: true, image: true } } },
    });
    return NextResponse.json(story, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to create story" }, { status: 400 }); }
}
