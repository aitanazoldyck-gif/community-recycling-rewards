import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getFriendIds } from "@/lib/social";

const schema = z.object({
  postId: z.string().min(1),
  reaction: z.enum(["LIKE", "LOVE", "CELEBRATE", "SUPPORT"]).optional(),
  comment: z.string().trim().max(1000).optional(),
  parentId: z.string().optional(),
});

export async function POST(request: Request) {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  try {
    const data = schema.parse(await request.json());
    const post = await db.socialPost.findFirst({ where: { id: data.postId, deletedAt: null, authorId: { in: await getFriendIds(result.session.user.id) } } });
    if (!post) return NextResponse.json({ error: "Post is not available." }, { status: 404 });
    if (data.reaction) {
      const item = await db.socialPostReaction.upsert({ where: { postId_userId: { postId: data.postId, userId: result.session.user.id } }, update: { type: data.reaction }, create: { postId: data.postId, userId: result.session.user.id, type: data.reaction } });
      return NextResponse.json(item);
    }
    if (data.comment) {
      const item = await db.socialPostComment.create({ data: { postId: data.postId, authorId: result.session.user.id, parentId: data.parentId, body: data.comment }, include: { author: { select: { name: true, image: true } } } });
      return NextResponse.json(item, { status: 201 });
    }
    return NextResponse.json({ error: "Reaction or comment required." }, { status: 400 });
  } catch { return NextResponse.json({ error: "Unable to update post." }, { status: 400 }); }
}
