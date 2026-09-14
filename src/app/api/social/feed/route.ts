import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { isValidMediaUrl } from "@/lib/social";

const postSchema = z.object({
  body: z.string().trim().max(2000).optional(),
  mediaUrls: z.array(z.string().max(2_000_000)).max(8).default([]),
  isVideo: z.boolean().default(false),
}).refine((data) => Boolean(data.body) || data.mediaUrls.length > 0, "Add a caption or media to publish.");

const updatePostSchema = z.object({
  body: z.string().trim().max(2000).optional(),
  mediaUrls: z.array(z.string().max(2_000_000)).max(8).optional(),
  isVideo: z.boolean().optional(),
});

export async function GET(request: Request) {
  const result = await requireRole(["RESIDENT", "ADMIN"]);
  if ("error" in result) return result.error;
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const posts = await db.socialPost.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 10,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      author: { select: { id: true, name: true, image: true } },
      reactions: true,
      comments: { orderBy: { createdAt: "asc" }, take: 3, include: { author: { select: { name: true, image: true } } } },
    },
  });
  return NextResponse.json({ posts, nextCursor: posts.length === 10 ? posts.at(-1)?.id : null });
}

export async function PATCH(request: Request) {
  const result = await requireRole(["RESIDENT", "ADMIN"]);
  if ("error" in result) return result.error;
  try {
    const data = updatePostSchema.parse(await request.json());
    if (data.mediaUrls?.some((url) => !isValidMediaUrl(url))) {
      return NextResponse.json({ error: "Media must use a secure URL or image/video upload." }, { status: 400 });
    }
    const postId = new URL(request.url).searchParams.get("postId");
    if (!postId) return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    const post = await db.socialPost.findFirst({ where: { id: postId, deletedAt: null } });
    if (!post || (post.authorId !== result.session.user.id && result.session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "You cannot edit this post." }, { status: 403 });
    }
    const updated = await db.socialPost.update({
      where: { id: postId },
      data: {
        ...(data.body !== undefined ? { body: data.body || null } : {}),
        ...(data.mediaUrls !== undefined ? { mediaUrls: data.mediaUrls } : {}),
        ...(data.isVideo !== undefined ? { isVideo: data.isVideo } : {}),
      },
      include: { author: { select: { id: true, name: true, image: true } }, reactions: true, comments: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? error.flatten() : "Unable to update post" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const result = await requireRole(["RESIDENT", "ADMIN"]);
  if ("error" in result) return result.error;
  const postId = new URL(request.url).searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
  const post = await db.socialPost.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post || (post.authorId !== result.session.user.id && result.session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "You cannot delete this post." }, { status: 403 });
  }
  await db.socialPost.update({ where: { id: postId }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const result = await requireRole(["RESIDENT", "ADMIN"]);
  if ("error" in result) return result.error;
  try {
    const data = postSchema.parse(await request.json());
    if (data.mediaUrls.some((url) => !isValidMediaUrl(url))) {
      return NextResponse.json({ error: "Media must use a secure URL or image/video upload." }, { status: 400 });
    }
    const post = await db.socialPost.create({
      data: { authorId: result.session.user.id, body: data.body || null, mediaUrls: data.mediaUrls, isVideo: data.isVideo },
      include: { author: { select: { id: true, name: true, image: true } }, reactions: true, comments: true },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? error.flatten() : "Unable to publish post" }, { status: 400 });
  }
}
