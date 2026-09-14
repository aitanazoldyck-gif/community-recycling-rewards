import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";
import { db } from "@/lib/db";

const schema = z.object({ conversationId: z.string().optional(), recipientId: z.string().optional(), body: z.string().trim().min(1).max(2000) });

export async function GET() {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  const conversations = await db.conversation.findMany({ where: { members: { some: { userId: result.session.user.id } } }, orderBy: { updatedAt: "desc" }, include: { members: { include: { user: { select: { id: true, name: true, image: true } } } }, messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { name: true } } } } } });
  return NextResponse.json(conversations);
}

export async function POST(request: Request) {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  try {
    const data = schema.parse(await request.json());
    let conversationId = data.conversationId;
    if (conversationId) {
      const member = await db.conversationMember.findFirst({ where: { conversationId, userId: result.session.user.id } });
      if (!member) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    } else if (data.recipientId) {
      const existing = await db.conversation.findFirst({ where: { members: { every: { userId: { in: [result.session.user.id, data.recipientId] } } } }, select: { id: true } });
      conversationId = existing?.id;
      if (!conversationId) {
        const conversation = await db.conversation.create({ data: { members: { create: [{ userId: result.session.user.id }, { userId: data.recipientId }] } } });
        conversationId = conversation.id;
      }
    } else return NextResponse.json({ error: "Recipient or conversation is required." }, { status: 400 });
    const message = await db.socialMessage.create({ data: { conversationId, senderId: result.session.user.id, body: data.body } });
    await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return NextResponse.json(message, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to send message." }, { status: 400 }); }
}
